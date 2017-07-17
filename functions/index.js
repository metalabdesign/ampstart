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
  const host = process.env.NODE_ENV === 'production'
    ? `https://${req.hostname}`
    : `http://${req.hostname}:5000`

  res.header('amp-access-control-allow-source-origin', host);

  next();
}

/**
 * Cast a value to an array.
 *
 * The value is coerced to an array, in the case that the provided value is
 * null, undefined or an empty string, an empty array is returned.

 * @param  {any} val - any value.
 * @returns {array} an array.
 */
function castArray(val) {
  if (Array.isArray(val)) {
    return val;
  }

  if (val === undefined || val === '' || val === null) {
    return [];
  }

  return [val];
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

  // omit every result that doesn't pass _every_ filter
  data.forEach((val) => {
    var push = true;

    // if we fail a filter condition, then don't push
    // check if we're over the max price
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
    if (query.types.length > 0) {
      query.types.forEach((type) => {
        if (val.types.includes(type)) found = true;
      });
    } else {
      // assume it's found if there's no `query.types` on the request
      found = true;
    }
    if (!found) {
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
 * Checks to see if any the given cities exist in our travel data,
 * returning all the ones that are.
 *
 * @param {Array} data - Array of objects containing the travel data to
 * filter.
 * @param {Array} cities - Array of strings containing city names.
 * @return {Array} The selected cities.
 */
function selectedCities(travelData, cities) {
  var selected = [];
  travelData.activities.forEach((data) => {
    const isSelected = cities.includes(data.location.city);

    // check if the city already exists in our cities array
    var existsIdx = -1;
    selected.forEach((city, idx) => {
      if (city.name === data.location.city) {
        existsIdx = idx;
      }
    });

    const city = travelData.cities.find((city) => city.name === datal.location.city);

    // if it doesn't exist already, add it
    if (existsIdx === -1) {
      selected.push({
        img: city ? city.img : '',
        name: data.location.city,
        isSelected: isSelected,
      });
    // otherwise update the existing entry only if it's currently false,
    // otherwise we could overwrite a previous match
    } else {
      if (!selected[existsIdx].isSelected) {
        selected[existsIdx].isSelected = isSelected;
      }
    }
  });

  return selected;
}

/**
 * sortResults checks to see if the value is one of the parameters we
 * know how to sort by.
 *
 * @param {String} val - The value to check.
 * @param {Array} results - Array of object to sort.
 * @return {Array} The sorted results.
 */
function sortResults(val, results) {
  if (typeof(val) !== "string") {
    return results;
  }

  switch (val.toLowerCase()) {
    case "popularity-desc":
      results.sort((a, b) => {
        return a.reviews.count <= b.reviews.count;
      });
      break;

    case "rating-desc":
      results.sort((a, b) => {
        return a.reviews.averageRaiting <= b.reviews.averageRaiting;
      });
      break;

    case "age-asc":
      // not sure how to handle this with current data set
      results.sort((a, b) => {
        return b.flags.includes("new");
      });
      break;

    case "price-asc":
      results.sort((a, b) => {
        return a.price.value - b.price.value;
      });
      break;

    default:
      break;
  }

  return results;
}

/**
 * Search handles the search and filtering functionality.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
exports.search = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    req.query.cities = castArray(req.query.cities);
    req.query.maxPrice = req.query.maxPrice || 0;
    req.query.types = castArray(req.query.types);

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

    var results = filter(travelData.activities, req.query);

    results = sortResults(req.query.sort, results);
    var cities = selectedCities(travelData.activities, req.query.cities);

    const stats = {
      cities: cities,
      allCities: !req.query.cities.length || cities.every((city) => !req.query.cities.includes(city.name)),
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
    };

    // The entire api response is wrapped in an `items` array in order to
    // make amp-list mustache template rendering more flexible.
    res.json({items: [{
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
