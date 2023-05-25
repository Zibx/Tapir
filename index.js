var DataType = function(name, cfg){


	var ctor = function(){
		this.ctor && this.ctor.apply(this, arguments);
	};
	// BEST INHERITANCE
	cfg.name = name;
	Object.assign(this, cfg);
	name = cfg.name;
	delete cfg.name;
	Object.assign(ctor, cfg);
	Object.defineProperty(ctor, 'name', {
		writable: true,
		value: name
	});
	ctor.prototype = this;
	return ctor;
};


const mappers = {
	OR: new DataType('OR', {
		ctor: function(possible) {
			this.possible = possible;
		},
		validate: function(val, schema, errs, path) {
			for( var i = 0, _i = this.possible.length; i < _i; i++ ){
				var possibleElement = this.possible[ i ];
				try{
					var subErs = [];
					if( validateSingleValue( possibleElement, val, possibleElement, subErs, path ) ){
						return val;
					}
				}catch(e){

				}
			}

			throw new Error('`'+JSON.stringify(val)+'` does not match '+
				this.possible.map(i=>i.name).join(' || '))

		}
	}),
	Object: new DataType('Object', {
		validate: function(val, schema, errs, path) {
			if(typeof val !== 'object'){
				throw new Error( '`' + JSON.stringify(val) + '` is not an object' )
			}
			if(schema.options){
				return validate(val, schema.options, errs, path);
			}
			return val;
		}
	}),
	Enum: new DataType('Enum', {
		ctor: function() {
			this.values = [].slice.call(arguments);
			this.valuesHash = this.values.reduce((s, k)=>{s[k] = k; return s;}, {})
		},
		validate: function(val) {
			if(!(val in this.valuesHash)){
				throw new Error('Enum does not match `'+val+'`')
			}
			return this.valuesHash[val];
		}
	}),
	String: new DataType('String', {validate: ( t ) => {
		if( typeof t !== 'string' ) {
			throw new Error( '`' + t + '` is not a string' )
		}
		return t;
	}}),
	Boolean: new DataType('Boolean', {validate: ( t ) => {
		if( '1,true,yes,yep,y'.split( ',' ).indexOf( t ) > -1 || t === 1 )
			return true;
		if( '0,false,n,no,nope,null'.split( ',' ).indexOf( t ) > -1 || t === 0 )
			return false;

		if( typeof t !== 'boolean' ) {
			throw new Error( '`' + t + '` is not boolean' )
		}
		return t;
	}}),
	Number: new DataType('Number', {validate: ( t ) => {
		if( typeof t !== 'number' ) {
			let x = parseFloat( t )
			if( x == t )
				return x;

			throw new Error( '`' + t + '` is not a number' )
		}
		return t;
	}}),
	Array: new DataType('Array', {validate: ( t ) => {
		try {
			if( Array.isArray( t ) )
				return t;
			let res = JSON.parse( t );
			if( !Array.isArray( res ) )
				throw new Error( '`' + t + '` is not an Array' )
			return res;
		} catch( e ) {
			throw new Error( '`' + t + '` is not an Array' )

		}
	}}),
	Date: new DataType('Date', {validate: ( t ) => {
		try {
			var d = new Date( t );
			if( isNaN( +d ) ) {
				throw new Error( '`' + t + '` invalid Date' )
			}
			return d;
		} catch( e ) {
			throw new Error( '`' + t + '` invalid Date' )
		}
	}}),
	Any: new DataType('Any', {validate: ( t ) => t})
};
var fs = require('fs');
var path = require('path');
const validate = function(obj, schema, errs, path) {

	const out = {};

	errs = errs || [];
	path = path || []

	for( let k in schema ) if( schema.hasOwnProperty( k ) ) {
		if( schema[ k ].required ) {
			if( !( k in obj ) ) {
				errs.push( {
					key: path.concat(k).join('.'),
					type: schema[ k ].type.name,
					description: `Required argument ${k} (${schema[ k ].type.name}) is not specified`
				} );
				continue;
			}


			if( obj[ k ] === null || obj[ k ] === void 0 ) {
				if( schema[ k ].empty ) {
					out[ k ] = obj[ k ];
					continue
				} else {
					errs.push({
						key: path.concat(k).join('.'),
						type: schema[ k ].type.name,
						description: `Argument ${k} (${schema[ k ].type.name}) can not be empty`
					} );
					continue
				}
			}
		}

		if( obj[ k ] === null || obj[ k ] === void 0 ) {
			if( schema[ k ].default ) {
				out[ k ] = schema[ k ].default;
			} else {
				out[ k ] = obj[ k ];
			}
			continue
		}

		var type = schema[ k ].type;


		if(Array.isArray(type)){
			type = schema[ k ].type = new mappers.OR(type);
		}
		try{
			out[ k ] = validateSingleValue( type, obj[ k ], schema[ k ], errs, path.concat(k) )
		}catch( e ){

		}

	}

	return out;
};
const validateSingleValue = function(type, val, schema, errs, path) {


	if(!(type instanceof DataType)){
		if( typeof type !== 'string' ){
			type = type.name;
		}

		if(!(type in mappers)){
			errs.push(`Unknown argument type: ${path.join('.')}<${type}>`)
			throw new Error();
		}else{
			type = mappers[type];
		}
	}
	var typeName = type.name;

	try{
		return type.validate( val, schema , errs, path );
	}catch( e ){
		errs.push( {
			key: path.join( '.' ),
			type: typeName,
			description: `Argument \`${path.join( '.' )}\` (${typeName}) type mismatch: ${e.message}`
		});
		throw new Error();
	}
};
const parseArgs = function( req, res, opts, body ) {
	const query = Object.assign( {}, body, req.params, req.query );

	const errs = [];
	const args = validate(query, opts, errs )

	if( errs.length )
		throw errs;

	return args;
};

function getDate( date ) {
	if( date instanceof Date ) {
		return {
			day: date.getDate(),
			month: date.getMonth(),
			//monthName: months[date.getMonth()],
			year: date.getFullYear(),
			date: date
		};
	} else if( date === null || date === void 0 ) {
		return null;
	} else {
		return date;
	}
}

var globalAPI = {};
var methodsHash = 'GET,POST,UPDATE,DELETE,PUT,HEAD,TRACE,OPTIONS,CONNECT'
	.split( ',' )
	.reduce( function( s, k ) {
		s[ k ] = 1;
		return s;
	}, {} )


var Tapir = function( cfg ) {
	var routes = false;

	if(!('router' in cfg)){
		routes = cfg;
		var Router = require('node-async-router');
		cfg = {router: new Router()};
	}

	cfg = Object.assign( {}, Tapir.defaults, cfg || {} );
	if( !( 'router' in cfg ) ) {
		throw new Error( 'Configure object does not contain router' );
	}

	var routesConsumer = function( routes ) {
		var plainRoutes = {};
		if(cfg.docs){
			routes[cfg.docs] = {
				method: 'GET',
				headers: {"Content-Type": "text/html; charset=utf-8"},
				description: 'Route to this Tapir generated documentation',
				fn: function(req, res){
					return fs.readFileSync(path.join(__dirname,'public','API.html'), 'utf-8')
						.replace('$API$', exports.api2html(plainRoutes));
				}
			}
		}

		plainRoutes = exports.api2routes( routes, cfg.router, cfg );
	};

	if(routes){
		routesConsumer(routes);
		return cfg.router;
	}

	return routesConsumer;
};
Tapir.defaults = {
	pretty: false,
	timeout: 30000,
	docs: '/api',
	headers: {"Content-Type": "application/json; charset=utf-8"}
};

var Group = function(description, routes) {
	if(!(this instanceof Group)){
		return new Group(description, routes);
	}
	if(typeof description !== 'string'){
		Object.assign(this, description);
	}else{
		this.description = description;
	}
	this.routes = routes;
};
Group.prototype = {
	description: null,
	routes: {},
	collapsed: true
};

var exports = module.exports = {
	Enum: mappers.Enum,
	Group: Group,
	mappers: mappers,
	Type: mappers,
	tapir: Tapir,
	api2html: function( apis ) {
		var out = [];

		var blocks = {
			'zz%%': { block: { title: '… other' }, items: [] }
		};
		for( let key in apis ) {

			var tokens = key.split( ':' );


			let api = apis[ key ], args = {};

			if( tokens[ 0 ].toUpperCase() in methodsHash ) {
				api.method = tokens[ 0 ];
				key = tokens.slice( 1 ).join( ':' );
			}

			if( key[ 0 ] !== '/' ) {
				key = '/' + key;
			}

			if( 'block' in api ) {
				var block = api.block;
				if( !( block.title in blocks ) ) {
					blocks[ block.title ] = { block: block, items: [] };
				}
				blocks[ block.title ].items.push( {
					key: key,
					api: api
				} );
			} else {
				blocks[ 'zz%%' ].items.push( {
					key: key,
					api: api
				} );
			}
		}
		var list = Object
			.keys( blocks )
			.sort()
			.map( key => blocks[ key ] );

		for( var i = 0, _i = list.length; i < _i; i++ ) {
			var listElement = list[ i ];
			var items = listElement.items;
			if( items.length === 0 )
				continue;

			var summary = listElement.block.summary, description = listElement.block.description;
			if(!summary){
				if(description && description.length < 100){
					summary = description;
					description = void 0;
				}
			}

			out.push( '<div class="api-block'+(listElement.block.collapsed === false?'':' collapsed')+'">' );

			if( listElement.block.title ) {
				out.push( '<div class="api-block__title" onclick="toggle(this)"><div class="api-block__collapser"></div>' + listElement.block.title + '</div>' );
			}
			if( summary ) {
				out.push( '<div class="api-block__summary">' + summary + '</div>' );
			}

			out.push( '<div class="after-title">' );

			if( description ) {
				out.push( '<div class="api-block__description">' + description + '</div>' );
			}

			out.push( '<div class="api-block__content">' );


			for( var j = 0, _j = items.length; j < _j; j++ ) {
				var item = items[ j ],
					key = item.key,
					api = item.api;

				if( api.hidden )
					continue;

				var optionNames = Object.keys( api.options || {} );

var drawDataType = function(opt) {
		if(typeof opt === 'string' || !('type' in opt)){
			opt = {type: opt}
		}
		return `<span class="api-option-type">${opt.hint || opt.type.name || opt.type}</span>`+
			('of' in opt?` of ` +
			(Array.isArray(opt.of)?opt.of:[opt.of])
				.map(drawDataType)
				.map((el,i,full)=>el+
					(i<full.length-2?', ':i===full.length-2?' or ':''))
				.join(''):'');
};
var drawOptions = function(options){
	var optionNames = Object.keys( options || {} );

	return optionNames.map( optName => {
		let opt = options[ optName ];



		let nested = opt.options;
		return `<div class="api-option collapsed">
		<div class="api-option-row${nested?' api-option__nested':''}"${nested?' onclick="toggle(this)"':''}>
				${nested?`<div class="api-block__collapser"></div>`:''}
			<span class="api-option-name">${optName}</span>
			${drawDataType(opt)}
			${opt.required ? '<span class="api-option-required">Required</span>' : '<span class="api-option-optional">Optional</span>'}
			${'default' in opt ? '<span class="api-option-default">= '+(opt.default+'')+'</span>' : ''}
			${opt.description? `&nbsp; <span class="api-option-description">${opt.description}</span>`:''}
    </div>
    ${nested?`<div class="after-title">${drawOptions( opt.options )}</div>`:''}    
    </div>`;
	} ).join( '' );
}
var summary = api.summary, description = api.description;
				if(!summary){
					if(description && description.length < 100){
						summary = description;
						description = void 0;
					}
				}
				out.push( `<div class="api"><H2 class="request-type request-type-${api.method.toLowerCase()}">${api.method} ${key}</H2>

${summary?`<div class="api-summary">${summary}</div>`:''}
${description?`<div class="api-description">${description}</div>`:''}
  ${optionNames.length > 0 ? `
    <div class="api-options"><span class="api-options-title">Arguments</span>
    ${drawOptions(api.options)}
    </div>` :
					''}

</div>` )

			}
			out.push( '</div>' );
			out.push( '</div>' );


			out.push( '</div>' );

		}

		return out.join( '' )
	},
	api2routes: function( apis, router, cfg ) {
		var routes = {};
		cfg = Object.assign( {}, Tapir.defaults, cfg );

		for( let blockName in apis ) {
			let maybeBlock = apis[ blockName ];
			let block;
			let blockInfo = { title: '… other' };
			if(maybeBlock instanceof Group){
				block = maybeBlock.routes;
				blockInfo = maybeBlock;
				blockInfo.title = blockName;
			}else{
				block = {};
				block[blockName] = maybeBlock;
				blockInfo = { title: '… other' }
			}

			for(let key in block) {

				let api = block[ key ], args = {};

				routes[key] = api;

				if(!('block' in api)){
					api.block = blockInfo;
				}

				var tokens = key.split( ':' );

				if( tokens[ 0 ].toUpperCase() in methodsHash ) {
					api.method = tokens[ 0 ];
					key = tokens.slice( 1 ).join( ':' );
				}

				if( key[ 0 ] !== '/' ) {
					key = '/' + key;
				}

				var pointer = globalAPI;
				if(!('method' in api)){
					throw new Error('Route method is not specified for route '+ key)
				}
				router[ api.method.toLowerCase() ]( key, async function( req, res, next ) {
					let timeout;

					if( 'middleware' in api ) {
						!Array.isArray( api.middleware ) && ( api.middleware = [ api.middleware ] );
					}

					if( 'middlewareAuth' in api ) {
						!Array.isArray( api.middlewareAuth ) && ( api.middlewareAuth = [ api.middlewareAuth ] );
						api.middleware = api.middlewareAuth.concat( api.middleware || [] );
					}

					var timoutDelay = 'timeout' in api ? api.timeout : cfg.timeout;
					if( timoutDelay !== false ) {
						timeout = setTimeout( () => {
							try {
								if(res.destroyed || res.finished){
									return console.log('ERR 84: Check write after end')
								}
								res.status( 408 );
								res.end( '{"error": true, "data": "Timeout"}' );
								res.connection.destroy();
							} catch( e ) {

							}
						}, timoutDelay );
					}
					let result;
					let resultError, middlewareResult;
					try {
						if( 'middleware' in api ) {
							result = await new Promise( ( r, j ) => {
								res.on( 'end', () =>{ clearTimeout( timeout ); middlewareResult = true; r() });


								var call = function( num ) {
									var called = false;
									if( num >= api.middleware.length )
										return r();

									api.middleware[ num ].call( api, req, res, ( val ) => {
										if( called )
											return;
										called = true;

										if( val instanceof Error ) {
											j( val );
										}

										call( num + 1 );
									} );
								}
								call( 0 );
							} );
						}
					} catch( e ) {
						resultError = e;
					}

					if( !api.raw ) {
						let rawBody;
						if( req.method !== 'GET' ) {
							try {
                var maxBodyLength = api.maxBodyLength || 1e6;
                rawBody = await new Promise( function( r, j ) {
                  if( req.body ) {
                    return r( JSON.stringify(req.body) );
                  }
                  var body = '';

                  req.on( 'data', function( data ) {
                    body += data;

                    if( body.length > maxBodyLength ) {
                      console.log('Request excided the maximum size of '+ maxBodyLength +' bytes!');
                      req.connection.destroy();
                      j();
                    }
                  } );

                  req.on( 'end', function() {
                    r( body );
                  } );
                } );

                args.body = rawBody === '' ? void 0 : JSON.parse( rawBody );
							} catch( e ) {
								args.body = null;
								resultError = e;
							}
						}

						var header = api.header || api.headers || cfg.header || cfg.headers;
						if(header){
							for(var name in header){
								res.header( name, header[name] );
							}
						}

						try {
							if(api.rawBody){
								args = Object.assign({}, api.options, args.body);
								args.$$rawBody = rawBody;
							}else{
								args = parseArgs( req, res, api.options, args.body || {} );
							}
						} catch( e ) {
							if(res.destroyed || res.finished){
								return console.log('ERR 31: Check write after end')
							}
							res.status(400);
							if( req.headers && req.headers.accept === 'application/json' ){
								res.end(JSON.stringify( { error: true, data: e } ) );
							}else{
								return res.end( 'Errors:\n' + e.map( e => '\t' + e.description ).join( '\n' ) )
							}
						}

						if( api.nolog ) {
							console.log( api.method, key );
						} else {
							console.log( api.method, key, JSON.stringify( args ) );
						}


					}
					try {
						if( api.auth ) {
							if( !( await api.auth( args, req, res ) ) ) {
								throw new Error( 'Very bad auth' );
							}
						}
					} catch( e ) {
						resultError = e;
					}
					try {

						if( 'fn' in api ) {
							result = await api.fn( args, req, res, next );
						}
					} catch( e ) {
						resultError = e;
					}
					clearTimeout( timeout );


					if( resultError ) {
						const e = resultError;
						//res.status(400)
						if(res.destroyed || res.finished){
							return console.log('ERR 14: Check write after end')
						}

						if( req.headers.accept === 'application/json' ) {
							res.end(JSON.stringify( { error: true, data: e.message, stack: e.stack } ) );
						} else {
							res.end(e.message + '\n' + e.stack );
						}
					} else if(!middlewareResult) {
						if(res.destroyed || res.finished){
							return console.log('ERR 17: Check write after end')
						}

						res.end( typeof result === 'string' ? result : (
							JSON.stringify( result, null, cfg.pretty ? 1 : 0 )
						), 'utf-8' );

					}

				} );

				tokens = key.substr( 1 ).split( '/' ).filter( String );

				var lastPointer;
				for( var i = 0, _i = tokens.length; i < _i; i++ ) {
					if( i === 0 && tokens[ i ] === 'api' )
						continue;
					if( tokens[ i ][ 0 ] === ':' )
						continue
					pointer = pointer[ tokens[ i ] ] || ( pointer[ tokens[ i ] ] = {} );
					if( i < _i - 1 ) {
						lastPointer = pointer;
					}
				}

				var fn = async function( args ) {
					try {
						return await api.fn( args || {} );
					} catch( e ) {
						throw e;
					}
				};

				if( api.shortcut === false ) {
					lastPointer[ tokens[ tokens.length - 1 ] ] = fn;
				} else {
					pointer[ api.shortcut || api.method.toLowerCase() ] = fn;
				}
			}
		}
		return routes;

	},
	api: globalAPI
};

module.exports = Object.assign( Tapir, module.exports );
