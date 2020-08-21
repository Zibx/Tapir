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
		}
	})
});

app.use(router);

app.listen(8666);