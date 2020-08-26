const assert = require( 'chai' ).assert;
const Tapir = require( '../' );
describe( 'instanciating', function() {
	it( 'should create Tapir', function() {
		var gets = 0, posts = 0;
		var fakeRouter = {
			get: function( uri, fn ) {
				assert.equal( uri.indexOf( 'GET' ), -1 );
				gets++;
			},
			post: function( uri, fn ) {
				assert.equal( uri.indexOf( 'POST' ), -1 );
				posts++;
			}
		};
		var api = new Tapir( {
			router: fakeRouter,
			docs: '/api'
		} );

		api( {
			'Application': Tapir.Group( `Some application specific methods`, {
				'POST:/app/version': {
					description: 'Get api versions',
					fn: function( args, req, res, next ) {
						//handleResult(req, res, next)(null, { Android: 1, IOS: 1 });
						return { Android: 1, IOS: 1 };
					}
				},
				'POST:/app/config': {
					middleware: function( req, res, next ) {
						seneca.act( {
							role: "config",
							cmd: "getInitialConfig"
						}, provideData( req ), handleResult( req, res, next ) );
					}
				},

			} ),

			'Tours': Tapir.Group( 'Tours crud', {
				'POST:/tours/admin': {
					authMiddleware: ( req, res, next ) => {
						next()
					},
					middleware: function( req, res, next ) {
						seneca.act( {
							role: "tour",
							cmd: "retrieveAdminTours"
						}, provideData( req ), handleResult( req, res, next, tourArrayLog ) );
					}
				},
			} ),

			'GET:/app/demo': {
				options: {
					num: { type: Number, description: 'Very important number of milliseconds', default: 1000 },
					str: { type: String, description: 'Output message', required: true },
				},
				description: 'Method for demonstration',
				fn: async ( args ) => {

					console.log( args );

					return await new Promise( ( r, j ) => {
						setTimeout( () => r( args.str ), args.num )
					} );
				}
			}
		} );

		// with api generated
		assert.equal( gets, 2 );
		assert.equal( posts, 3 );
	} )
} );

describe( 'methods call', function() {
	it( 'should call routes', async function() {
		var gets = 0, posts = 0;
		var list = {};
		var fakeRouter = {
			get: function( uri, fn ) {
				assert.equal( uri.indexOf( 'GET' ), -1 );
				gets++;
				list[uri] = fn;
			},
			post: function( uri, fn ) {
				assert.equal( uri.indexOf( 'POST' ), -1 );
				posts++;
				list[uri] = fn;

			}
		};
		var api = new Tapir( {
			router: fakeRouter,
			docs: '/api',
			timeout: false,
		} );

		api( {
			'Application': Tapir.Group( `Some application specific methods`, {
				'POST:/app/version': {
					description: 'Get api versions',
					fn: function( args, req, res, next ) {
						//handleResult(req, res, next)(null, { Android: 1, IOS: 1 });
						return { Android: 1, IOS: 1 };
					}
				},
				'POST:/app/config': {
					middleware: function( req, res, next ) {
						seneca.act( {
							role: "config",
							cmd: "getInitialConfig"
						}, provideData( req ), handleResult( req, res, next ) );
					}
				},

			} ),

			'Tours': Tapir.Group( 'Tours crud', {
				'POST:/tours/admin': {
					options: {
						authed: {type: Boolean, required: true}
					},
					middlewareAuth: ( req, res, next ) => {
						if(req.body.authed)
							next()
					},
					middleware: function( req, res, next ) {
						if(req.body.err)
							return next(new Error(req.body.err));
						res.end('YEP!')
					}
				},
			} ),

			'GET:/app/demo': {
				options: {
					num: { type: Number, description: 'Very important number of milliseconds', default: 1000 },
					str: { type: String, description: 'Output message', required: true },
				},
				description: 'Method for demonstration',
				fn: async ( args ) => {

					console.log( args );

					return await new Promise( ( r, j ) => {
						setTimeout( () => r( args.str ), args.num )
					} );
				}
			}
		} );
		assert.equal((await Tapir.api.get()).length > 1000, true);
		await list['/app/demo']({
			method: 'GET',
		},{header: ()=>{}, status: ()=>{}, end: function(a) {
			assert.equal(a.indexOf('Required argument str')>-1, true);
		}})
		await list['/app/demo']({
			method: 'GET',
			params: {num: '300', str: 'test'}
		},{header: ()=>{}, status: ()=>{}, end: function(a) {
				assert.equal(a, 'test');
		}})

		await list['/app/demo']({
			method: 'GET',
			params: {num: '3f+i00', str: 'test'}
		},{header: ()=>{}, status: ()=>{}, end: function(a) {
				assert.equal(a.indexOf('is not a number')>-1, true);

			}})

		await list['/tours/admin']({
			body: {},
			headers: {},
			method: 'POST',
			params: {num: '3f+i00', str: 'test'}
		},{header: ()=>{}, status: ()=>{}, end: function(a) {
				assert.equal(a.indexOf('is not specified')>-1, true);
			}})

		await list['/tours/admin']({
			body: {"authed": true},
			headers: {},
			method: 'POST',
			//params: {num: '3f+i00', str: 'test'}
		},{header: ()=>{}, status: ()=>{}, 
			l: {},
			on: function(a,b){
				(this.l[a] || (this.l[a] = [])).push(b);
				},
			emit: function(a,b,c,d){
				(this.l[a] || []).forEach(f=>f.call(this,b,c,d))
			},
			end: function(a) {console.log(a)
				assert.equal(a.indexOf('YEP!')>-1, true);
				this.emit('end');
			}})


		await list['/tours/admin']({
			body: {"authed": true, "err": 'da'},
			headers: {},
			method: 'POST',
			//params: {num: '3f+i00', str: 'test'}
		},{header: ()=>{}, status: ()=>{}, 
			l: {},
			on: function(a,b){
				(this.l[a] || (this.l[a] = [])).push(b);
			},
			emit: function(a,b,c,d){
				(this.l[a] || []).forEach(f=>f.call(this,b,c,d))
			},
			end: function(a) {
				assert.equal(a.indexOf('Error: da')>-1, true);
				this.emit('end');
			}})
	} )
} );