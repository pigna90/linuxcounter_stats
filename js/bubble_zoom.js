const C1 = "#586f7c";
const C2 = "#c8bfc7";
const C3 = "#353535";
const C4 = "#7ea8be";
const C5 = "#f6fOed";

window.onload = function(){
	var margin = 15,
		diameter = 700;

	var color_scale = d3.scale.linear()
		.domain([-1, 5])
		.range(["green", "yellow"])
		.interpolate(d3.interpolateHcl);

	//Set root color to body color
	var color = function(d){ return d == 0 ? "white" : color_scale(d)}

	//Layout settings for bubbles
	var pack = d3.layout.pack()
		.padding(3)
		.size([diameter - margin, diameter - margin])
		.value(function(d) { return d.size; })
		.radius(10)
		.sort(function(a, b) {return -(a.value - b.value);})

	//Select div that will contain chart and add svg element
	var svg = d3.select("div#chart").append("svg")
		.attr("width", diameter)
		.attr("height", diameter)
		.append("g")
		.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

	//Read json file
	d3.json("data/data.json", function(error, root) {
		if (error) throw error;

		//root.children = (root.children).filter(function(d){
			//if(d.size <= 1)
				//return d
		//})

		var focus = root,
			nodes = pack.nodes(root),
			view;

		var circle = svg.selectAll("circle")
			.data(nodes)
			.enter().append("circle")
			.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
			.style("fill", function(d) { return d.children ? color(d.depth) : "red"; })
			.on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
			.on("mouseover",function(d,i){
				console.log("rootParent:")
				console.log(rootParent(d))
				svg.selectAll("circle")
					.attr("stroke-width",function(e) {
						if(root.children.indexOf(e) != -1 ){
							return e.size <= rootParent(d).size ? "1.5px" : null;}
						else
							return null;
					})
					.attr("stroke",function(e) {
						if(root.children.indexOf(e) != -1){
							return e.size <= rootParent(d).size ? "#000" : null;}
						else
							return null;
					})
		   ;})
		   .on("mouseout",function(d,i){
				svg.selectAll("circle")
				.attr("stroke-width",null)
				.attr("stroke",null)
		   ;});

		var text = svg.selectAll("text")
			.data(nodes)
			.enter().append("text")
			.attr("class", "label")
			.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
			.style("display", function(d) { return d.parent === root ? "inline" : "none"; })
			.text(function(d) { return d.size + (d.size > 14 ? d.name : null); });

		var node = svg.selectAll("circle,text");

		d3.select("body")
			.style("background", color(-1))
			.on("click", function() { zoom(root); });

		zoomTo([root.x, root.y, root.r * 2 + margin]);

		function zoom(d) {
			var focus0 = focus; focus = d;

			var transition = d3.transition()
				.duration(d3.event.altKey ? 7500 : 750)
				.tween("zoom", function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
						return function(t) { zoomTo(i(t)); };
			});

		transition.selectAll("text")
			.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
			.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
			.each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
			.each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
		}

		function zoomTo(v) {
			var k = diameter / v[2]; view = v;
			node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
			circle.attr("r", function(d) { return d.r * k; });
		}
	});
	d3.select(self.frameElement).style("height", diameter + "px");
}

function rootParent(e){
	if(e.depth > 1){
		return rootParent(e.parent)
	}
	else
		return e
}
