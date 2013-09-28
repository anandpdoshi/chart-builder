// TODO
// 1. Type selection based on first 10 rows
// 1. Option to select Header Row
// 1. Transposer - Slick Grid should change
// 1. Dialog Box to select options
// 1. Pie chart
// 1. Get settings
// 1. Save settings
// 1. Checked Rows - Save and Retrieve

$(document).ready(function() {
	get_csv();
});

window.grid;

var get_csv = function() {
	$.get("wb-india.csv", function(data) {
		data = CSVToArray(data);
		show_in_grid(data);
		set_column_selects();
		$(window).trigger("resize");
		show_chart();
	});
};

var show_in_grid = function(data) {
	var columns = [];
	var checkboxSelector = new Slick.CheckboxSelectColumn({
	      cssClass: "slick-cell-checkboxsel"
	    });
    columns.push(checkboxSelector.getColumnDefinition());
	
	for(var i=0, j=data[0].length; i < j; i++) {
		var d = data[0][i];
		var v = d.toLowerCase().replace(/ /g, "_");
		columns.push({
			id: v, name: d, field: v
		})
	}
	
	var objlist = [];
	for(var ri=1, rlen=data.length; ri < rlen; ri++) {
		var row = {};
		for(var ci=0, clen=data[ri].length; ci < clen; ci++) {
			row[columns[ci+1].field] = data[ri][ci];
			
			// better type selection
			if(!columns[ci+1].type && data[ri][ci] && !isNaN(data[ri][ci])) columns[ci+1].type = "number";
		}
		row["color"] = random_color().join(",");
		objlist.push(row);
	}

	var options = {
	  enableCellNavigation: true,
	  enableColumnReorder: false
	};
	
    window.grid = new Slick.Grid("#slickgrid", objlist, columns, options);
	grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
	grid.registerPlugin(checkboxSelector);
	grid.setSelectedRows([0, 1, 2]);
	grid.getSelectionModel().onSelectedRangesChanged.subscribe(function() {
		window.show_chart();
	});
}

var random_color = function() {
	var r = Math.floor(Math.random() * 256),
        g = Math.floor(Math.random() * 256),
        b = Math.floor(Math.random() * 256);
	return [r, g, b];
}

var set_column_selects = function() {
	window.start_column = $("#start-column").on("change", show_chart);
	window.end_column = $("#end-column").on("change", show_chart);
	window.legend_column = $("#legend-column").on("change", show_legend);
	var columns = grid.getColumns();
	var len = columns.length;
	var start_val, end_val;
	$.each(columns, function(i, v) {
		window.start_column.append('<option value="'+ i +'">'+v.name+'</option>');
		if(v.type==="number") {
			end_val = i;
			start_val = (i - 10) >= 0 ? (i - 10) : 0;
		} else {
			window.legend_column.append('<option value="'+ i +'">'+v.name+'</option>');
		}
	});
	window.end_column.html(window.start_column.html());
	window.start_column.val(start_val);
	window.end_column.val(end_val);
}

var show_chart = function() {
	if(!grid) return;
	var columns = $.map(grid.getColumns(), function(v, i) { 
		return (i >= window.start_column.val() && i<=window.end_column.val()) ? v.name : null;
	});
	var data = grid.getData();
	var datasets = [];

	$.each(grid.getSelectedRows(), function(i, rowid) {
		var row = [];
		for(var i=0, l=columns.length; i<l; i++) {
			row.push(parseFloat(data[rowid][columns[i]] || 0));
		}
		color = data[rowid]["color"];
		datasets.push({
			fillColor : "rgba("+color+",0.5)",
			strokeColor : "rgba("+color+",1)",
			pointColor : "rgba("+color+",1)",
			pointStrokeColor : "#fff",
			data : row
		});
	});
	
	
	var opts = {
		labels : columns,
		datasets : datasets
	};
	
	var ctx = document.getElementById("chart").getContext("2d");
	var myNewChart = new Chart(ctx).Line(opts);
	
	show_legend();
	
	var canvas_height = $("#chart").parent().height();
	var window_height = $(window).height() - 50;
	if(window_height > canvas_height) {
		canvas_height = window_height;
	}
	$("#slickgrid").css("height", canvas_height).attr("height", canvas_height);
	grid.resizeCanvas();
}

var show_legend = function() {
	var data = grid.getData();
	var colid = $("#legend-column").val();
	var fieldname = grid.getColumns()[colid].field;
	var $legend = $("#legend").empty();
	$.each(grid.getSelectedRows(), function(i, rowid) {
		var row = data[rowid];
		$legend.append('<div class="row">\
				<div class="legend-circle" style="background-color: rgba('+row.color+',0.5); \
					border: 2px solid rgb('+row.color+')"></div>\
				<span>'+row[fieldname]+'</span>\
			</div>');
	});
}

$(window).on("resize", function() {
	var $canvas = $("#chart");
	$canvas.attr("width", $canvas.parent().width());
	show_chart();
});

var get_modal = function(content) {
	var modal = $('<div class="modal" style="overflow: auto;" tabindex="-1">\
		<div class="modal-dialog">\
			<div class="modal-content">\
				<div class="modal-header">\
					<a type="button" class="close"\
						data-dismiss="modal" aria-hidden="true">&times;</a>\
					<h4 class="modal-title">Edit HTML</h4>\
				</div>\
				<div class="modal-body ui-front">\
					<textarea class="form-control" \
						style="min-height: 200px; margin-bottom: 10px;\
						font-family: Monaco, Fixed">'+content+'</textarea>\
					<button class="btn btn-success">Update</button>\
				</div>\
			</div>\
		</div>\
		</div>').appendTo(document.body);
		
	return modal;
};
