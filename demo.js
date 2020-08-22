const App = require('express');
const Router  = require('node-async-router');

const app = new App(),
	router = new Router(),
	Tapir = require('.'),
	api = new Tapir({
		router
	});

api({
    'Some routes': Tapir.Group(`This is some <b>routes</b>`, {
    	'POST:/api/route1': {
    		options: {
    			data:{
    				type: 'Any',
					description: 'Data wrapper object',
					hint: 'Request data',
					required: true,
					options: {
    					who: {type: String},
    					when: {type: Date},
						what: {
    						type: Array,
							description: 'Array of numbers, actions or a Cat',
							of: [
								Number,
								{
									type: 'Any',
									hint: 'Action',
									options: {
										id: {type: Number},
										type: {type: String}
									}
								},
								{
									type: 'Any',
									hint: 'Cat',
									options: {
										catName: {type: String}
									}
								}
								]
						}
					}
				}
    		},
			fn: (args)=>args//JSON.stringify(args, null, 2)
		},
		'GET:/api/goose': {
    		options: {
    			khm: {type: 'Any', hint: 'Khe', options: {
    				oh: {type: String},
					ah: {type: Boolean}
				}
			}}
		},
		'DELETE:/api/goose': {
    		description: 'If you wish to get rid of the goose',
    		options: {
    			khm: {type: 'Any', hint: 'Khe', options: {
    				oh: {type: String},
					ah: {type: Boolean}
				}
			}}
		},
		'PUT:/api/goose': {
    		options: {
    			khm: {type: 'Any', hint: 'Khe', options: {
    				oh: {type: String},
					ah: {type: Boolean}
				}
			}}
		},
		'OPTIONS:/api/goose': {
    		options: {
    			khm: {type: 'Any', hint: 'Khe', options: {
    				oh: {type: String},
					ah: {type: Boolean}
				}
			}}
		},
		'HEAD:/api/goose': {
    		options: {
    			khm: {type: 'Any', hint: 'Khe', options: {
    				oh: {type: String},
					ah: {type: Boolean}
				}
			}}
		},
		'CONNECT:/api/goose': {},
		'TRACE:/api/goose': {},

	})
});

app.use(router);

var DEMO_PORT = 8666;
app.listen(DEMO_PORT);
console.log('Demo api is listening on '+ DEMO_PORT);