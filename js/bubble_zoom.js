const C1 = "#586f7c";
const C2 = "#c8bfc7";
const C3 = "#353535";
const C4 = "#7ea8be";
const C5 = "#f2f2f2";

/*Javascript main*/
window.onload = function(){
	bubbleChart(null)	
}

/*Draws first 10 elements of data that comes from json*/
function bubbleChart(n){
	var json = jsonName()
	
	var margin = 10,
		diameter = 800;
		
	//Select div that will contain chart and add svg element
	var svg = d3.select("div#chart")
		.classed("svg-container", true) //container class to make it responsive
		.append("svg")
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 " + diameter + " " + diameter + "") //Responsive SVG
		.classed("svg-content-responsive", true)
		.append("g")
		.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

	//Read json from file
	d3.json("./data/json/" + json, function(error, root) {
		if (error) throw error;

		var linearSize = d3.scale.linear()
		.domain([1,root.size])
		.range([10,root.size])

		//Layout settings for bubbles
		var pack = d3.layout.pack()
			.padding(2)
			.size([diameter - margin, diameter - margin])
			.value(function(d) { return linearSize(d.size); })
			.sort(function(a, b) {return -(a.value - b.value);})
		
		//Select node with size minor of n
		if (n != null)
			root.children = (root.children).filter(function(d){
				if(d.size <= n)
					return d
			})

		//Start with focus on root
		var focus = root,
			nodes = pack.nodes(root),
			view;

		//Count number of machines
		var max_radius = 0;
		for(i in root.children){
			if(root.children[i].r > max_radius)
				max_radius = root.children[i].r;
		}
		
		document.getElementById("size").innerHTML = root.size + " Machines";

		var circle = svg.selectAll("circle")
			.data(nodes)
			.enter().append("circle")
			.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
			.style("fill", function(d) {
				if(d.depth == 0)
					return color(d.depth)
				else
					//To void color override
					if (d.parent.r == d.r && d.depth != 4){
						return color(d.parent.depth)
					}
					else
						return color(d.depth)
			})
			.on("click", function(d) {
				//Choose action based on type of mode: zoom or nodes selection
				if (focus != d && !statusRadioButton())
					if (d.depth != 4)
						zoom(d), d3.event.stopPropagation();
					else
						zoom(d.parent), d3.event.stopPropagation();
				else if(statusRadioButton())
					rewriteBubbleChart(parentOf(1,d).size)
			})
			.on("mouseover",function(d,i){
				//Write node informations on dashboard
				writeNodeInformation(d)
				//Show number of machines of node selected
				var machines = document.getElementById("size")
				machines.innerHTML = d.size + " Machines";
				machines.style.color = color(d.depth)
				svg.selectAll("circle")
					.attr("opacity",function(e){
						if(statusRadioButton())
							//Highlight only node with size minor of node selected d
							return parentOf(1,e).size <= parentOf(1,d).size ? null : 0.4;
						else
							//Highlight only the selected node
							return e != d && parentOf(d.depth,e) != d ? 0.4 : null;
					})
		   ;})
		   .on("mouseout",function(d,i){
				deleteNodeInformation(d)

				var machines = document.getElementById("size")
				machines.innerHTML = root.size + " Machines";
				machines.style.color = "black"
				
				svg.selectAll("circle")
				.attr("opacity",null)
		   ;})

		//Tooltip for circles
		circle.append("title")
			.text(function(){return statusRadioButton() ? "Click to Reshape" : "Click to Zoom" })

		var text = svg.selectAll("text").filter(".chart")
			.data(nodes)
			.enter().append("text")
			.attr("class", "label chart")
			.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
			.style("display", function(d) { return d.parent === root ? "inline" : "none"; })
			.attr("text-anchor", "middle")
			.attr("dy", ".35em")
			.text(function(d) {
				//If radius is minor of 25% then write the name inside
				return (d.r/max_radius)*100 >= 25 ? toAcronym(d.name) : null
			})

		
		var node = svg.selectAll("circle,text");

		//Zoom-out event for body
		d3.select("body")
			.on("click", function() { zoom(root); });

		//Initial focus on all bubbles
		zoomTo([root.x, root.y, root.r * 2 + margin]);

		function zoom(d) {
			var focus0 = focus; focus = d;

			var transition = d3.transition()
				.duration(750)
				.tween("zoom", function(d) {
					var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
					return function(t) { zoomTo(i(t)); };
				});

			transition.selectAll("text").filter(".chart")
				.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
				.transition().duration(function(){return focus.depth > focus0.depth ? 200 : 0})
				.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
				.attr("class", "label chart")
				.each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
				.each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; })
				.text(function(e) {
					if(d.name == "machine"){
						return (e.r/max_radius)*100 >= 25 ? toAcronym(e.name) : null
					}
					else{
						return (e.r/d.r)*100 >= 5 ? toAcronym(e.name) : null
					}
				})
				
		}

		function zoomTo(v) {
			var k = diameter / v[2]; view = v;
			node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
			circle.attr("r", function(d) { return d.r * k; });
		}
	});
	d3.select(self.frameElement).style("height", diameter + "px");
}

/*Reshaping chart due to Ordered Selection or hierarchy order changing*/
function rewriteBubbleChart(n){
	//Svg removing
	var svg = d3.select("svg")

	svg.selectAll("text")
		.remove()	
	svg.selectAll("circle")
		.remove()
	svg.remove()

	var rootButton = document.getElementById('root-button')
	//Reshape the chart with same number of elements
	if(n == null){
		rootButton.disabled = true
		rootButton.style.display = "none"
		rootButton.style.opacity = 0.6
	}
	//Reshape the chart with n number of elements
	else{
		b_selected = document.getElementById('view_selected')
		b_all = document.getElementById('view_all')

		//Radio buttons to original state
		b_selected.checked = false
		b_all.checked = true
		radioChecked(b_selected)
		radioChecked(b_all)

		//Hiding Root Button
		rootButton.disabled = false
		rootButton.style.display = "inline-block"
		rootButton.style.opacity = 1
	}

	bubbleChart(n)
}

/*Return the parent with depth d of node e*/
function parentOf(d,e){
	if(e.depth > d)
		return parentOf(d,e.parent)
	else
		return e
}

/*Return the status of radio buttons in mode panel*/
function statusRadioButton(){
	if(document.getElementById('view_all').checked)
		return 0
	else
		return 1
}

/*Write node informations on the dashboard based on his depth*/
function writeNodeInformation(n){
	if(n.depth != 0){
		var id;
		switch(n.depth){
			case 1: id="distro";
					break;
			case 2: id="class";
					break;
			case 3: id="arch";
					break;
			case 4: id="cores";
					break;
			default: id="-";
					break;
		}
		textBox = document.getElementById(id)
		textBox.innerHTML = n.name;
		textBox.style.color = color(n.depth)

		writeNodeInformation(n.parent)
	}
}

/*Clear Dashboard */
function deleteNodeInformation(n){
	document.getElementById("distro").innerHTML = "-";
	document.getElementById("class").innerHTML = "-";
	document.getElementById("arch").innerHTML = "-";
	document.getElementById("cores").innerHTML = "-";
}

/*Function for click event on radio buttons*/
function radioChecked(e){
	labels = document.getElementById("view-form").getElementsByTagName("label");
	var circle = d3.select("svg").selectAll("circle")
	if(labels[0].getAttribute("for") == e.getAttribute("id")){
		//Changing the properties of buttons and his labels
		labels[0].style.fontWeight = "bold"
		labels[1].style.fontWeight = "normal"
		//Add tooltip to each circle
		circle.select("title").text("Click to Zoom")
	}
	else{
		labels[1].style.fontWeight = "bold"
		labels[0].style.fontWeight = "normal"
		circle.select("title").text("Click to Reshape")
	}
}

/*String s to his acronym*/
function toAcronym(s){
	words = s.split(" ")
	var out = ""
	if(words.length > 1){
		for(i in words){
			out += words[i][0] + " "
		}
		return out
	}
	else
		return s
}


/*Return color based on depth d*/
function color(d){
	switch(d){
		case -1:
			return "#729EA1";
			break;
		case 1:
			return "#3891A6";
			break;

		case 2:
			return "#F7B32B";
			break;

		case 3:
			return "#5BC0EB";
			break;

		case 4:
			return "#596570";
			break;
			
		default:
			return C5;
			break;
	}
}

/*Make the select boxes mutually exclusive and*/
/*reshape chart in case of changing.*/
function hierarchyChanged(e){
	var choices = 4; //Number of attributes
	var selected = [];
	var old;

	//List with indexes of elements selected
	for(i=1; i<=choices; i++)
		selected.push(document.getElementById("level_" + i).selectedIndex)

	//Find element missing on the select boxes
	for(j=0; j<choices; j++)
		if(selected.indexOf(j) == -1)
			old = j;

	//Replace element
	for(i=1; i<=choices; i++){
		var view = document.getElementById("level_" + i)

		if(view.selectedIndex == e.selectedIndex && view.getAttribute("id") != e.getAttribute("id"))
			view.selectedIndex = old;
	}
	//Rewrite chart
	rewriteBubbleChart(null)
}

/*Return the name of json file based on element selected in select boxes*/
function jsonName(){
	var choices = 4;
	var selected = [];
	for(i=1; i<=choices; i++)
		switch(document.getElementById("level_" + i).selectedIndex){
			case 0:
				selected.push("distribution");
				break;

			case 1:
				selected.push("architecture");
				break;

			case 2:
				selected.push("class");;
				break;

			case 3:
				selected.push("numCores");
				break;
		}
	return selected.join("_") + ".json";
}
