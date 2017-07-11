const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!');
});

function getSVGGraphPathData(data, width, height) {
  var max = Math.max.apply(null, data);

  var width = 800;
  var height = 100;
  var scaleH = width / (data.length - 1)
  var scaleV = height / max;

  var factor = 0.25;

  var commands = [`m0,${applyScaleV(data[0])}`];

  function round(val) {
    return Math.round(val * 1000) / 1000;
  }

  function applyScaleH(val) {
    return round(val * scaleH);
  }

  function applyScaleV(val) {
    return round(100 - val * scaleV);
  }

  for (let i = 0, max = data.length - 1; i < max; i++) {
    current = data[i];
    next = data[i + 1];

    let x = (i + 0.5);
    let y = current + (next - current) * 0.5

    let sX = (i + (0.5 - factor));
    let sY = current + (next - current) * (0.5 - factor);

    commands.push(`S${applyScaleH(sX)} ${applyScaleV(sY)},${applyScaleH(x)} ${applyScaleV(y)}`);
  }

  var finalY = data[data.length - 1];
  commands.push(`S${width} ${applyScaleV(finalY)},${width} ${applyScaleV(finalY)}`);

  return commands.join(' ');
};


exports.search = functions.https.onRequest((req, res) => {
  const host = 'http://localhost:5000';
  res.header('amp-access-control-allow-source-origin', host);

  console.log(req.query);

  // Mock data points representing price distribution.
  var priceData = [
    0,
    0,
    34.091,
    40.909,
    53.409,
    73.864,
    65.909,
    28.409,
    9.091,
    31.818,
    100,
    94.318,
    56.818,
    46.023,
    37.5,
    0,
    0,
  ];

  const selectedCities = req.query.city || [];

  // DANKHACKMODE ACTIVATE: https://github.com/ampproject/amphtml/issues/9536
  res.json({data: [{
    stats: {
      cities: [
        {name: 'La Paz', selected: selectedCities.includes('La Paz')},
        {name: 'Cancún', selected: selectedCities.includes('Cancún')},
        {name: 'Mexico City', selected: selectedCities.includes('Mexico City')},
        {name: 'Oaxaca', selected: selectedCities.includes('Oaxaca')},
        {name: 'Puebla', selected: selectedCities.includes('Puebla')},
        {name: 'Tijuana', selected: selectedCities.includes('Tijuana')},
      ],
      price: {
        graph: {
          pathData: getSVGGraphPathData(priceData, 800, 100),
          width: 800,
          height: 100
        },
        average: {
          min: 30.0,
          max: 100
        },
      },
      location: 'Mexico',
    },

    results: [
      {
        id: 'xxx-xxx-xx0',
        name: 'Sail Around the Eastern Mexican Coast',
        price: {
          value: 92.0,
          currency: 'USD',
        },
        location: {
          city: 'La Paz',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 4.0,
          count: 34,
        },
        flags: [],
        types: ['active', 'tours', 'water', 'nature'],
      },

      {
        id: 'xxx-xxx-xx1',
        name: 'A Tour of the Beaches of Cancún with a Local',
        price: {
          value: 70.0,
          currency: 'USD',
        },
        location: {
          city: 'Cancún',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 5.0,
          count: 12,
        },
        flags: ['new'],
        types: ['active', 'tours', 'water', 'nature'],
      },

      {
        id: 'xxx-xxx-xx2',
        name: 'Roads of the City',
        price: {
          value: 199.0,
          currency: 'USD',
        },
        location: {
          city: 'Mexico City',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: null,
          count: 0,
        },
        flags: ['new'],
        types: ['tours', 'nightlife'],
      },

      {
        id: 'xxx-xxx-xx3',
        name: 'Beer Excursion of Mexico City',
        price: {
          value: 40.0,
          currency: 'USD',
        },
        location: {
          city: 'Mexico City',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 3.0,
          count: 1,
        },
        flags: ['new'],
        types: ['bus', 'tours', 'food', 'drinks'],
      },

      {
        id: 'xxx-xxx-xx4',
        name: 'Surf Day. Board and Wetsuits Included in Price!',
        price: {
          value: 100.0,
          currency: 'USD',
        },
        location: {
          city: 'Oaxaca',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 5.0,
          count: 241,
        },
        flags: [],
        types: ['active', 'water'],
      },

      {
        id: 'xxx-xxx-xx5',
        name: 'Parque Zoologico',
        price: {
          value: 20.0,
          currency: 'USD',
        },
        location: {
          city: 'Mexico City',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 4.5,
          count: 104,
        },
        flags: [],
        types: ['tours', 'nature'],
      },

      {
        id: 'xxx-xxx-xx6',
        name: 'The Best Coffee in Mexico. Free Coffee for 2 hours',
        price: {
          value: 5.0,
          currency: 'USD',
        },
        location: {
          city: 'Tijuana',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 5.0,
          count: 2,
        },
        flags: ['new'],
        types: ['food', 'drinks'],
      },

      {
        id: 'xxx-xxx-xx7',
        name: 'Top Fashion Spots with Instagram Blogger',
        price: {
          value: 45.0,
          currency: 'USD',
        },
        location: {
          city: 'Mexico City',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 4.0,
          count: 66,
        },
        flags: [],
        types: ['fashion', 'artistic'],
      },

      {
        id: 'xxx-xxx-xx8',
        name: 'Mexican Meat Market',
        price: {
          value: 19.0,
          currency: 'USD',
        },
        location: {
          city: 'Mexico City',
          lat: 0,
          lng: 0,
        },
        reviews: {
          averageRaiting: 2.0,
          count: 11,
        },
        flags: [],
        types: ['food'],
      },
    ],
  }]});
});
