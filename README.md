# Tapir API wrapper

Dear developer! Saddle one of our beautiful tapirs and have a good ride!

We made too much express routing and at one point we made a wrapper that handles:
 * routing
 * authorization
 * async methods
 * request options
 * errors
 * internal calls
 * API docs generation
 * API testing
 
 Yes, our tapirs know that there is a swagger snorkelling out there. The Swagger is a great tool if you like to write (or generate) that enormous configuration files.
 
 Tapir loves juicy requests with a body filled with JSON. We would change this behaviour in future releases.
 
 # How to install
 
 # Simple example

 
 # Concepts
 
 ## Routing
 
 Tapir likes to tie URI with the request method, but you can specify `method` as a route property if you wish.
 
 Common CRUD for all standard tapir manipulations can look like this:
 ```
 POST:/api/tapir
 GET:/api/tapir
 GET:/api/tapir/:id
 PUT:/api/tapir/:id
 REMOVE:/api/tapir/:id
```

# Tapir options

```js
const Tapir = require('api-tapir'),
      api = new Tapir({
        timeout: 66666,
        router: express.Router(),
        docs: 'GET:/myApi'
      });
```

### `router` \<express router\>
Tapir would try to require `express` and create an instance of Router itself if this argument is not specified.

### `timeout` \<Number\> = 30000 
Default request timeout duration in `milliseconds`. You can overwrite it in the route options. 

### `docs` \<String|falsy value\> = GET:/api


# API route options 

Each of your API leaves can be configured

Keep in mind that all options are optional.

### `options` \<key-value\> — query parameters
Specify all parameters that your api method needs. This specifications would be used for `type checking`, `type casting`, `default values`, `documentation`.

> Tapir get parameters from request body < URI matched parts < URI query parameters  

##### `type` — option type
Tapir knows basic types: Number, String, Boolean, Array, Date, "Any".
> This would be extended in a future version. Tapir would be able to cast nested properties.

You can extend it in Tapir's module `mappers`.
The extend method is a function that takes something as an argument and returns it in the proper data type. If input data is wrong — you MUST throw an Exception.

##### `default` — default property value 
##### `required` \<Boolean\>
Tapir throws an Error if `required` property is not specified. 

##### `description` \<String\> — describe the parameter  



### `fn` \<Function\> (args, request, response)
This is the function that is doing the real work. It can be async.
If this function throws an Error — it would be sent in the response. 

### `auth` \<Function\> (args, request, response)
Authorization checking function that can be async. If specified — should return true if the user looks authorized enough.

_Feel free to modify args object_

### `description` \<String\>


### `middleware` \<Function | [Function]\> 
Middleware pattern for queries processing. It is widely used in express.js, passport.js 

### `middlewareAuth` \<Function | [Function]\>
Just glued before anything in `middleware`

### `timeout` \<Number\> = Tapir.config.timeout ≈ 30000
Request timeout duration in `milliseconds`. 

### `maxBodyLength` \<Number\> = 1e6
Specifies maximum request size