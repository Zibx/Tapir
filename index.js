const mappers = {
	String: ( t ) => {
		if( typeof t !== 'string' ) {
			throw new Error( '`' + t + '` is not a string' )
		}
		return t;
	},
	Boolean: ( t ) => {
		if( '1,true,yes,yep,y'.split( ',' ).indexOf( t ) > -1 || t === 1 )
			return true;
		if( '0,false,n,no,nope,null'.split( ',' ).indexOf( t ) > -1 || t === 0 )
			return false;

		if( typeof t !== 'boolean' ) {
			throw new Error( '`' + t + '` is not boolean' )
		}
		return t;
	},
	Number: ( t ) => {
		if( typeof t !== 'number' ) {
			let x = parseFloat( t )
			if( x == t )
				return x;

			throw new Error( '`' + t + '` is not a number' )
		}
		return t;
	},
	Array: ( t ) => {
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
	},
	Date: ( t ) => {
		try {
			var d = new Date( t );
			if( isNaN( +d ) ) {
				throw new Error( '`' + t + '` invalid Date' )
			}
			return d;
		} catch( e ) {
			throw new Error( '`' + t + '` invalid Date' )
		}
	},
	Any: ( t ) => t
};
const parseArgs = function( req, res, opts, body ) {
	const query = Object.assign( {}, body, req.params, req.query );
	const args = {};
	const errs = [];
	for( let k in opts ) if( opts.hasOwnProperty( k ) ) {
		if( opts[ k ].required ) {
			if( !( k in query ) ) {
				errs.push( `Required argument ${k} (${opts[ k ].type.name}) is not specified` );
				continue;
			}


			if( query[ k ] === null || query[ k ] === void 0 ) {
				if( opts[ k ].empty ) {
					args[ k ] = query[ k ];
					continue
				} else {
					errs.push( `Argument ${k} (${opts[ k ].type.name}) can not be empty` );
					continue
				}
			}
		}

		if( query[ k ] === null || query[ k ] === void 0 ) {
			if( opts[ k ].default ) {
				args[ k ] = opts[ k ].default;
			} else {
				args[ k ] = query[ k ];
			}
			continue
		}
		try {
			args[ k ] = mappers[ opts[ k ].type.name ]( query[ k ] )
		} catch( e ) {
			errs.push( `Argument \`${k}\` (${opts[ k ].type.name}) type mismatch: ${e.message}` );
		}
	}
	if( errs.length )
		throw errs;

	return args;
};
var fs = require( 'fs' );
var logStream = fs.createWriteStream( "/tmp/kus-quizard.txt", { flags: 'a' } );

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

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'Jule',
	'August',
	'September',
	'October',
	'November',
	'December'
];
const shortMonths = months.map( function( name ) {
	return name.substr( 0, 3 );
} );
shortMonths[ 8 ] = 'Sept';

function humanDate( date ) {
	let d = getDate( date );
	return [ d.day, shortMonths[ d.month ], d.year ].join( ' ' );
}

var globalAPI = {};
var methodsHash = 'GET,POST,UPDATE,DELETE,PUT'
	.split( ',' )
	.reduce( function( s, k ) {
		s[ k ] = 1;
		return s;
	}, {} )


var Tapir = function( cfg ) {

	cfg = Object.assign( {}, Tapir.defaults, cfg || {} );
	if( !( 'router' in cfg ) ) {
		throw new Error( 'Configure object does not contain router' );
	}

	var routesConsumer = function( routes ) {
		exports.api2routes( routes, cfg.router, cfg );
	};

	return routesConsumer;
};
Tapir.defaults = {
	timeout: 30000,

};

var exports = module.exports = {
	mappers: mappers,
	tapir: Tapir,
	api2html: function( apis ) {
		var out = [];

		var cruds = {
			'zz%%': { crud: { title: '… other' }, items: [] }
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

			if( 'crud' in api ) {
				var crud = api.crud;
				if( !( crud.title in cruds ) ) {
					cruds[ crud.title ] = { crud: crud, items: [] };
				}
				cruds[ crud.title ].items.push( {
					key: key,
					api: api
				} );
			} else {
				cruds[ 'zz%%' ].items.push( {
					key: key,
					api: api
				} );
			}
		}
		var list = Object
			.keys( cruds )
			.sort()
			.map( key => cruds[ key ] );

		for( var i = 0, _i = list.length; i < _i; i++ ) {
			var listElement = list[ i ];
			var items = listElement.items;
			if( items.length === 0 )
				continue;
			out.push( '<div class="crud-block collapsed">' );

			if( listElement.crud.title ) {
				out.push( '<div class="crud-title" onclick="toggle(this)"><div class="crud-collapser"></div>' + listElement.crud.title + '</div>' );
			}
			out.push( '<div class="after-title">' );

			if( listElement.crud.description ) {
				out.push( '<div class="crud-description">' + listElement.crud.description + '</div>' );
			}

			out.push( '<div class="crud-content">' );


			for( var j = 0, _j = items.length; j < _j; j++ ) {
				var item = items[ j ],
					key = item.key,
					api = item.api;

				if( api.hidden )
					continue;

				var optionNames = Object.keys( api.options || {} );

				out.push( `<div class="api"><H2>${api.method} ${key}</H2>
<div class="api-description">${api.summary}</div>
  ${optionNames.length > 0 ? `
    <div class="api-options"><span class="api-options-title">Options:</span>
    ${optionNames.map( optName => {
						let opt = api.options[ optName ];
						return `<div class="api-option">
    <span class="api-option-name">${optName}</span>
    <span class="api-option-type">${opt.type.name || opt.type}</span>
    ${opt.required ? '<span class="api-option-required">Required</span>' : '<span class="api-option-optional">Optional</span>'}
    &nbsp;— <span class="api-option-description">${opt.description}</span>
    </div>`;
					} ).join( '' )}
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

		cfg = Object.assign( {}, Tapir.defaults, cfg );

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

			var pointer = globalAPI;

			router[ api.method.toLowerCase() ]( key, async function( req, res, next ) {
				let timeout;

				if( 'middleware' in api ) {
					!Array.isArray( api.middleware ) && ( api.middleware = [ api.middleware ] );
				}

				if( 'middlewareAuth' in api ) {
					!Array.isArray( api.middlewareAuth ) && ( api.middlewareAuth = [ api.middlewareAuth ] );
					api.middleware = api.middlewareAuth.concat( api.middleware || [] );
				}

				if( !api.raw ) {
					timeout = setTimeout( () => {
						res.status( 408 );
						res.end( '{"error": true, "data": "Timeout"}' );
						try {
							res.connection.destroy();
						} catch( e ) {

						}
					}, 'timeout' in api ? api.timeout : cfg.timeout );


					if( req.method !== 'GET' ) {
						try {
							args.body = await new Promise( function( r, j ) {
								var body = '';

								req.on( 'data', function( data ) {
									body += data;

									// Too much POST data, kill the connection!
									// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
									if( body.length > 1e6 ) {
										req.connection.destroy();
										j();
									}
								} );

								req.on( 'end', function() {
									try {
										r( body === '' ? void 0 : JSON.parse( body ) );
									} catch( e ) {
										console.error( e )
										j( body );
									}
								} );
							} )
						} catch( e ) {
							args.body = null;
						}
					}

					try {
						args = parseArgs( req, res, api.options, args.body || {} );
					} catch( e ) {

						return res.end( 'Errors:\n' + e.map( e => '\t' + e ).join( '\n' ) )
					}

					if( api.nolog ) {
						console.log( api.method, key );
					} else {
						console.log( api.method, key, JSON.stringify( args ) );
					}


					res.header( "Content-Type", "application/json; charset=utf-8" );
				}
				try {
					if( api.auth ) {
						if( !( await api.auth( args, req, res ) ) ) {
							throw new Error( 'Very bad auth' );
						}
					}
					let result;

					if( 'middleware' in api ) {
						result = await new Promise( ( r, j ) => {
							res.on( 'end', () => clearTimeout( timeout ) );
							api.middleware( req, res, ( val ) => {
								if( val instanceof Error ) {
									j( val );
								} else {
									r( val );
								}
							}, args );
						} );
					}

					if( 'fn' in api ) {
						result = await api.fn( args, req, res, next );
					}

					// fs.writeFileSync('./data/tmp/full.json', JSON.stringify(data, null, 2))
					logStream.write( `${humanDate( new Date() )} ${api.method}: ${key} ${JSON.stringify( args )}` )
					//logStream.write(`${JSON.stringify(result.log, null,1)}\n`);

					res.end( typeof result === 'string' ? result : JSON.stringify( result, null, 1 ), 'utf-8' );
					clearTimeout( timeout )
				} catch( e ) {

					logStream.write( `${humanDate( new Date() )} ${api.method}: ${key} ${JSON.stringify( args )}` )
					logStream.write( `ERROR: ${e.message + '\n' + e.stack}\n\n` )

					if( req.headers.accept === 'application/json' ) {
						res.end( JSON.stringify( { error: true, data: e.message, stack: e.stack } ) );
					} else {
						res.end( e.message + '\n' + e.stack );
					}
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
	},
	api: globalAPI
};

module.exports = Object.assign( Tapir, module.exports );
