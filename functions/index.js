const functions = require('firebase-functions');
const fs = require('fs');

// travelData is the sample data that we use to demo filtering on the frontend.
const travelData = JSON.parse(fs.readFileSync('data.json', 'utf8'));

/**
 * cors is HTTP middleware that sets an AMP-specific cross origin resource
 * sharing HTTP header on our response.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP resonse object.
 * @param {Function} next - The next HTTP handler to execute.
 */
function cors(req, res, next) {
  res.header(
    'amp-access-control-allow-source-origin',
    `${req.protocol}://${req.hostname}:5000`
  );

  next();
}

/**
 * filter returns the travel data that matches the given query.
 * 
 * @param {Array} data - Array of objects containing the travel data to
 * filter.
 * @param {Object} query - An HTTP request query object.
 * @return {Array} - An array of travelData objects.
 */
function filter(data, query) {
  var results = [];
  var push = true;

  // omit every results that doesn't pass _every_ filter
  data.forEach((val) => {
    var push = true;

    // if we fail a filter condition, then don't push
    if (query.maxPrice > 0) {
      if (val.price.value > query.maxPrice) {
        push = false;
      }
    }

    // check if the city is included
    if (query.cities.length > 0) {
      if (!query.cities.includes(val.location.city)) {
        push = false;
      }
    }

    // check if the type is anywhere to be found
    var found = false;
    if (query.type.length > 0) {
      query.type.forEach((type) => {
        if (val.types.includes(type)) found = true;
      });
    } else {
      // assume it's found if there's no query.type on the request
      found = true;
    }
    if (!found) {
      push = false;
    }

    // handle search maybe?? :thinking-face:
    // just try it with the name to see if it works
    // but obv search multiple fields
    if (query.query !== '') {
      if (!val.name.search(`/${query.query}/i`))
        push = false;
    }

    // if we found something, then push it to the results array
    if (push) {
      results.push(val);
    }
  });

  return results;
}

/**
 * Search handles the search and filtering functionality.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
exports.search = functions.https.onRequest((req, res) => {

  // sample data
  // req.query.maxPrice = 100;
  // req.query.cities = ["La Paz"];
  // req.query.type = ["active", "tours"];
  // req.query.query = "sail";

  cors(req, res, () => {
    req.query.cities = req.query.cities || []; // TODO for it to be an array even if its a string
    req.query.maxPrice = req.query.maxPrice || 0;
    req.query.type = req.query.type || []; // TODO same deal as cities
    req.query.query = req.query.query || '';

    // Not sure how to handle these yet...
    // const departureDate = req.query.departure;
    // const returnDate = req.query.return;

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

    var results = filter(travelData, req.query);

    const stats = {
      cities: results.map((result) => ({
        name: result.location.city,
        selected: req.query.cities.includes(result.location.city)
      })),
      //allCities: !req.query.cities.length || req.query.cities.includes(results.location.city),
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
      resultCount: results.length,
    }
    
    res.json({data: [{
      stats: stats,
      results: results,
    }]});

  });
});


// Helpers

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
