const Tapir = require( '../' ),
  chai = require( 'chai' ),
  assert = chai.assert;
chaiHttp = require( 'chai-http' ),
  express = require( 'express' ),
  Router = require( 'node-async-router' ),
  bodyParser = require( 'body-parser' );

chai.use( chaiHttp );

const app = express(),

  router = new Router(),

  api = new Tapir( {
    router
  } )( {
    'POST:/api/test': {
      description: 'Update something',
      options: {
        data: {
          type: 'Object',
          description: 'Data wrapper object',
          hint: 'Request data',
          required: true,
          options: {
            who: { type: String },
            when: { type: Date, required: true },
            what: {
              type: Object,
              description: 'Internal',
              options: {
                subj: { type: String, description: 'subject name' },
                subjType: { type: new Tapir.Enum( 'Cat', 'Dog', 'Elephant' ), description: 'subject type' }
              }
            },
            and: {
              type: Array,
              required: true,
              description: 'Array of numbers, actions or a Cat',
              of: [
                Number,
                {
                  type: 'Object',
                  hint: 'Action',
                  options: {
                    id: { type: Number },
                    type: { type: String }
                  }
                },
                {
                  type: 'Object',
                  hint: 'Cat',
                  options: {
                    catName: { type: String }
                  }
                }
              ]
            }
          }
        }
      },
      fn: ( args ) => args//JSON.stringify(args, null, 2)
    },
    'POST:/api/multitype': {
      options: {
        multi: { type: [ Number, String ] }
      },
      fn: ( args ) => args
    },
    'POST:api/enum': {
      options: {
        enum: { type: new Tapir.Enum( 'val0', 333 ) }
      },
      fn: ( args ) => args
    }
  } )
app.use( bodyParser() )
app.use( router );

var testRoute = function( uri, data, cb ){
  chai.request( app )
    .post( uri )
    .set( 'content-type', 'application/json' )
    .set( 'accept', 'application/json' )
    .send( data )
    .end( cb );
};
describe( 'validation', function(){
  it( 'invalid type', function( done ){
    chai.request( app )
      .post( '/api/test' )
      .set( 'content-type', 'application/json' )
      .set( 'accept', 'application/json' )
      .send( { data: 11 } )
      .end( ( err, res ) => {
        assert.equal( res.status, 400 );

        var obj = false;
        res.body.data.forEach( function( err ){
          if( err.type === 'Object' ){
            obj = true;
            assert.equal( err.key, 'data' );
          }
        } );
        assert.equal( obj, true );
        done();
      } );
  } );

  it( 'nested invalid', function( done ){
    testRoute( '/api/test', {
      data: { a: '123', confirmPassword: '123' }
    }, ( err, res ) => {
      assert.equal( res.status, 400 );

      var d = false, arr = false;
      res.body.data.forEach( function( err ){
        if( err.type === 'Date' ){
          d = true;
          assert.equal( err.key, 'data.when' );
        }else if( err.type === 'Array' ){
          arr = true
          assert.equal( err.key, 'data.and' );
        }
      } );
      assert.equal( d, true );
      assert.equal( arr, true );
      done();
    } );

  } );
  it( 'multitype', function( done ){
    testRoute( '/api/multitype', { multi: 10 }, ( err, res ) => {
      assert.equal( res.status, 200 );
      assert.equal( res.body.multi, 10 );
      done();
    } )
  } );

  it( 'multitype2', function( done ){
    testRoute( '/api/multitype', { multi: 'GGG' }, ( err, res ) => {
      assert.equal( res.status, 200 );
      assert.equal( res.body.multi, 'GGG' );
      done();
    } )
  } );

  it( 'multitype3', function( done ){
    testRoute( '/api/multitype', { multi: {g:2} }, ( err, res ) => {
      assert.equal( res.status, 400 );
      assert.equal( res.body.data[0].key, 'multi');
      done();
    } )
  } );

  it( 'enum1', function( done ){
    testRoute( '/api/enum', { enum: 'val0' }, ( err, res ) => {
      assert.equal( res.status, 200 );
      assert.equal( res.body.enum, 'val0' );
      done();
    } )
  } );

  it( 'enum value type should be saved', function( done ){
    testRoute( '/api/enum', { enum: '333' }, ( err, res ) => {
      assert.equal( res.status, 200 );
      assert.strictEqual( res.body.enum, 333 );
      done();
    } )
  } );

  it( 'enum. should return error if value does not match the enum', function( done ){
    testRoute( '/api/enum', { enum: '666' }, ( err, res ) => {
      assert.equal( res.status, 400 );
      assert.equal( res.body.data[0].key, 'enum');
      done();
    } )
  } );
} );