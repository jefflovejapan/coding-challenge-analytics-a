var GOLDEN = 1.618;

var DEFAULT_COUNTRY = {
  code: "CA",
  name: "Canada"
};

d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);

var width = document.getElementById('content').offsetWidth-20;
var height = width / GOLDEN;

var topo,projection,path,svg,g;

var tooltip = d3.select("#content").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
  projection = d3.geo.mercator()
    .translate([0, 0])
    .scale(width / 2 / Math.PI);

  path = d3.geo.path()
      .projection(projection);

  svg = d3.select("#content").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .call(zoom);

  g = svg.append("g");
  fetchCountryData(DEFAULT_COUNTRY.code);
  setCountryName(DEFAULT_COUNTRY.name);
}

var geodata;
d3.json("static/data/ne-countries-110m.json", function(error, world) {
  geodata = world.features;
  draw(geodata);
});

function draw(points) {

  var country = g.selectAll(".country").data(points);

  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; });

  //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
  var offsetL = document.getElementById('content').offsetLeft+(width/2)+40;
  var offsetT =document.getElementById('content').offsetTop+(height/2)+20;

  //tooltips
  country
    .on("mousemove", function(d,i) {
      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
        tooltip
          .classed("hidden", false)
          .attr("style", "left:"+(mouse[0] + offsetL)+"px;top:"+(mouse[1] + offsetT)+"px")
          .html(d.properties.name);
      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      })
      .on("click", function(d,i) {
        setCountryName(d.properties.name);
        fetchCountryData(d.properties.iso_a2);
      });
}

function setCountryName(name){
  document.querySelector("h1#country_header").innerHTML=name;
}

function fetchCountryData(countryCode) {
  var XHR = new XMLHttpRequest();
  XHR.open('POST', document.URL + 'country-data');
  var FD = new FormData();
  FD.append("country_code", countryCode);
  XHR.addEventListener('load', function() {
    var countryObj = JSON.parse(this.responseText);
    setSidebarText(countryObj);
  });
  XHR.send(FD);   
}

function setSidebarText(countryObj) {
  console.log(countryObj);
  document.querySelector("span#total_over_15k").innerHTML = countryObj.total_over_15k;
  document.querySelector("span#percentage_covered").innerHTML = countryObj.percentage_covered;
  document.querySelector("span#num_cities_covered").innerHTML = countryObj.num_cities_covered;
  document.querySelector("div#cities_covered").innerHTML = getCitiesList(countryObj.cities_covered);
  document.querySelector("div#cities_not_covered").innerHTML = getCitiesList(countryObj.cities_not_covered);
}

function getCitiesList(cities) {
  var buff = '';
  for (var i = 0; i < cities.length; i++) {
    buff += cities[i] + '</br>';
  }
  return buff;
}


function redraw() {
  width = document.getElementById('content').offsetWidth-60;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(geodata);
}

function move() {

  var t = d3.event.translate;
  var s = d3.event.scale;  
  var h = height / 3;
  
  t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
  t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

  zoom.translate(t);
  g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 100);
}