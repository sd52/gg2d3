var changeCountry, check, clock, fishPolygon, fisheye, getCountries, height, initList, map, onCountryClick, p, parseWorkerData, path, projection, refish, selectedCountry, sum, updateClock, width;

width = 482;

height = 482;

p = 40;

selectedCountry = "Germany";

projection = d3.geo.mercator().scale(height).translate([height / 2, height * 2 / 3]);

path = d3.geo.path().projection(projection);

fisheye = d3.fisheye().radius(50).power(10);

map = d3.select("#map").append("svg").attr("width", width).attr("height", height).append('g');

clock = d3.select("#clock").append("svg").attr("width", width).attr("height", height).append('g').attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

sum = function(numbers) {
  return _.reduce(numbers, function(a, b) {
    return a + b;
  });
};

fishPolygon = function(polygon) {
  return _.map(polygon, function(list) {
    return _.map(list, function(tuple) {
      var c;
      p = projection(tuple);
      c = fisheye({
        x: p[0],
        y: p[1]
      });
      return projection.invert([c.x, c.y]);
    });
  });
};

parseWorkerData = function(rawdata) {
  var addToData, data;
  data = new Object;
  addToData = function(item) {
    var country, day, hour, workers;
    country = item["Country"];
    workers = parseFloat(item["Workers"]);
    day = item["Day"];
    hour = item["Hour"];
    if (data[country]) {
      if (data[country][day]) {
        return data[country][day][hour] = workers;
      } else {
        return data[country][day] = [workers];
      }
    } else {
      return data[country] = [[workers]];
    }
  };
  _.map(rawdata, addToData);
  return data;
};

initList = function() {
  var list;
  list = $("<ul>").attr("id", "countries-list");
  _.map(_.keys(workerData), function(name) {
    var elem;
    elem = $("<li>").text(name);
    elem.click(function(event) {
      return changeCountry($(event.target).text());
    });
    return list.append(elem);
  });
  return $("#countries").append(list);
};

changeCountry = function(name) {
  selectedCountry = name;
  resetClock();
  resetMap();
  return resetList();
};

updateClock = function() {
  var angle, instance, mainClock, max, r, row, summed, total, transposed;
  instance = workerData[selectedCountry];
  transposed = _.zip.apply(this, instance);
  summed = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = transposed.length; _i < _len; _i++) {
      row = transposed[_i];
      _results.push(sum(row));
    }
    return _results;
  })();
  total = sum(summed);
  summed.push(summed[0]);
  max = _.max(summed);
  if (clock) clock.select("g.time").remove();
  mainClock = clock.selectAll("g.time").data([summed]).enter().append("g").attr("class", "time");
  r = height / 2;
  angle = function(d, i) {
    return i / 12 * Math.PI;
  };
  mainClock.append("path").attr("class", "area").attr("d", d3.svg.area.radial().innerRadius(0).outerRadius(function(d) {
    return r * d / max;
  }).angle(angle));
  return mainClock.append("path").attr("class", "line").attr("d", d3.svg.line.radial().radius(function(d) {
    return r * d / max;
  }).angle(angle));
};

onCountryClick = function(d, i) {
  var clicked, dom;
  clicked = d.properties.name;
  if (!_.contains(_.keys(workerData), clicked)) return;
  d3.selectAll(".selected").attr("class", "feature unselected");
  dom = d3.select(this).attr("class", "feature selected");
  return changeCountry(clicked);
};

getCountries = function() {
  return d3.json("world-countries.json", function(collection) {
    var l;
    this.names = (function() {
      var _i, _len, _ref, _results;
      _ref = collection.features;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        l = _ref[_i];
        _results.push(l.properties.name);
      }
      return _results;
    })();
    map.selectAll(".feature").data(collection.features).enter().append("path").attr("class", function(d) {
      var classStr, contained, name;
      contained = _.contains(_.keys(workerData), d.properties.name);
      classStr = "feature ";
      name = d.properties.name;
      if (name === selectedCountry) return classStr + "selected";
      if (contained) return classStr + "unselected";
      return classStr;
    }).attr("d", path).each(function(d) {
      return d.org = d.geometry.coordinates;
    }).on('click', onCountryClick);
    d3.select("svg").on("mousemove", refish);
    d3.select("svg").on("mousein", refish);
    d3.select("svg").on("mouseout", refish);
    d3.select("svg").on("touch", refish);
    return d3.select("svg").on("touchmove", refish);
  });
};

d3.csv("all_working_hours.csv", function(rawdata) {
  this.workerData = parseWorkerData(rawdata);
  getCountries();
  initList();
  return updateClock();
});

refish = function() {
  fisheye.center(d3.mouse(this));
  return map.selectAll(".feature").attr("d", function(d) {
    var clone, processed, type;
    clone = $.extend({}, d);
    type = clone.geometry.type;
    processed = type === "Polygon" ? fishPolygon(d.org) : _.map(d.org, fishPolygon);
    clone.geometry.coordinates = processed;
    return path(clone);
  });
};

check = function() {
  var l, _i, _len, _ref, _results;
  _ref = _.keys(odesk);
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    l = _ref[_i];
    if (names.indexOf(l) === -1) _results.push(l);
  }
  return _results;
};
