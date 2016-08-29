const C1 = "#586f7c";
const C2 = "#c8bfc7";
const C3 = "#353535";
const C4 = "#7ea8be";
const C5 = "#f6fOed";

window.onload = function(){
	bubbleChart(null)
}

/*Return the root parent with depth=1 of node e*/
function rootParent(e){
	if(e.depth > 1)
		return rootParent(e.parent)
	else
		return e
}

/*Return the status of radio buttons*/
function statusView(){
	if(document.getElementById('view_all').checked)
		return 0
	else if(document.getElementById('view_selected').checked)
		return 1
}

/**/
function rewriteBubbleChart(n){
	var svg = d3.select("svg")

	svg.selectAll("text")
		.remove()
		
	svg.selectAll("circle")
		.remove()
	
	svg.remove()

	document.getElementById('view_selected').checked = false
	document.getElementById('view_all').checked = true

	var rootButton = document.getElementById('root-button')
	if(n == null){
		rootButton.disabled = true
		rootButton.style.opacity = 0.6
	}
	else{
		rootButton.disabled = false
		rootButton.style.opacity = 1
	}

	bubbleChart(n)
}

function bubbleChart(n){
var margin = 10,
		diameter = 630;

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
	var svg = d3.select("div#chart")
		.classed("svg-container", true) //container class to make it responsive
		.append("svg")
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 " + diameter + " " + diameter + "") //Responsive SVG
		.classed("svg-content-responsive", true)
		.append("g")
		.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

	//Read json file
	d3.json("data/data.json", function(error, root) {
		if (error) throw error;

		if (n != null)
			root.children = (root.children).filter(function(d){
				if(d.size <= n)
					return d
			})

		//Count machines
		var count_machines = 0;
		for(i in root.children)
			count_machines += root.children[i].size;
		
		document.getElementById("size").innerHTML = count_machines + " Machines";

		var focus = root,
			nodes = pack.nodes(root),
			view;

		var circle = svg.selectAll("circle")
			.data(nodes)
			.enter().append("circle")
			.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
			.style("fill", function(d) { return d.children ? color(d.depth) : "red"; })
			.on("click", function(d) {
				if (focus != d && !statusView())
					zoom(d), d3.event.stopPropagation();
				else
					rewriteBubbleChart(d.size)
			})
			.on("mouseover",function(d,i){
				writeNodeInformation(d)
				svg.selectAll("circle")
					.attr("stroke-width",function(e) {
						if(root.children.indexOf(e) != -1 && statusView()){
							return e.size <= rootParent(d).size ? "1.5px" : null;}
						else
							return null;
					})
					.attr("stroke",function(e) {
						if(root.children.indexOf(e) != -1 && statusView()){
							return e.size <= rootParent(d).size ? "#000" : null;}
						else
							return null;
					})
		   ;})
		   .on("mouseout",function(d,i){
			   deleteNodeInformation(d)
				svg.selectAll("circle")
				.attr("stroke-width",null)
				.attr("stroke",null)
		   ;})

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

function writeNodeInformation(n){
	if(n.depth != 0){
		var label;
		switch(n.depth){
			case 1: label="distro";
					break;
			case 2: label="class";
					break;
			case 3: label="arch";
					break;
			case 4: label="cores";
					break;
			default: label="-";
					break;
		}
		document.getElementById(label).innerHTML = n.name + " (" + n.size + ")";
		writeNodeInformation(n.parent)
	}
	else
		return null;
}

function deleteNodeInformation(n){
	document.getElementById("distro").innerHTML = "-";
	document.getElementById("class").innerHTML = "-";
	document.getElementById("arch").innerHTML = "-";
	document.getElementById("cores").innerHTML = "-";
}
