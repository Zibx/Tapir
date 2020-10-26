// demo 2.0 Router is included into the Tapir, so simple footprint looks even better
const App = require('express');
const app = new App(),
  Tapir = require('.');

app.use(new Tapir({
  'Some routes': Tapir.Group({description: `This is some <b>routes</b>`, collapsed: false}, {
    'GET:/': {
      fn: function() {
        return 'yep';
      }
    },
    'POST:/api/route1': {
      description: 'Update something ',
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
              type: Object,
              description: 'Internal',
              options: {
                subj: {type: String, description: 'subject name'},
                subjType: {type: new Tapir.Enum('Cat', 'Dog', 'Elephant'), description: 'subject type'}
              }
            },
            and: {
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
      summary: 'List of geese',
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
    'TRACE:/api/goose': {}
  })
}));

var DEMO_PORT = 8666;
app.listen(DEMO_PORT);
console.log('Demo api is listening on '+ DEMO_PORT);