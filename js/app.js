// Todo - move to separate file after consulting with sree
// Utility function
(function(window, namespace, undefined){
    window[namespace] = window[namespace] || {};
    window[namespace].constants = function (argument) {
        this.map = this.map || {};
        if(typeof argument==="object") {
            $.extend(this.map,argument);
        }

        return this.map[argument];
    }
    window.namespace = window[namespace];
})(window, "VIZ");

// 
(function(window, $, d3, undefined){
    //Namespace
    var VIZ = window.VIZ || {},
        constants = {
            url: 'data/stocks.json',
            xlabel: "Returns in $",
            ylabel: "Close Price in K"
        };
    VIZ.constants(constants);

    // Todo - Delete after creating separate utility js file
    /*VIZ.constants = function(constant){
        var map = {
            url: 'data/nations.json',
            xlabel: "income per capita, inflation-adjusted (dollars)",
            ylabel: "life expectancy (years)"
        };

        return map[constant];
    };*/

    VIZ.events = (function(){
        function init(){

        }
        init();

        return {
        };
    })();

    // 
    VIZ.Model = function(){

    };

    VIZ.Model.prototype = {
        /* type : getData  
        *   returns a promise 
        */
        getData: function(){
            var that = this;
            var url = VIZ.constants('url');
            var promise = $.getJSON(url);
            promise.done(function(data){
                that.model = data;
            });
            return promise;
        },

        interpolateData : function(){


        },
        tweenYear : function(){

        },
        interpolateValues : function(){

        }
    };

    // Stock view
    VIZ.StockView = function(stocks){
        // Chart dimensions.
        var margin  = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
            width   = 960 - margin.right,
            height  = 500 - margin.top - margin.bottom,

            // Various accessors that specify the four dimensions of data to visualize.
            x       = function(d) { return d.Returns; },
            y       = function(d) { return d.ClosePrice; },
            radius  = function(d) { return d.Volume; },
            color   = function(d) { return d.Symbol; },
            key     = function(d) { return d.Symbol; },


            // Various scales. These domains make assumptions of data, naturally.
            xScale      = d3.scale.linear().domain([-8, 8]).range([-width /2, width/2]),
            yScale      = d3.scale.linear().domain([0, 800]).range([height,0]),
            radiusScale = d3.scale.sqrt().domain([0, 5e7]).range([0, 40]),
            colorScale  = d3.scale.category10(),

            xAxis       = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
            yAxis       = d3.svg.axis().scale(yScale).orient("left");

        // Create the SVG container and set the origin.
        svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + (width/2 + 10)  + "," + margin.top + ")");

        // Add the x-axis.
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the y-axis.
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        
        // Add an x-axis label.
        svg.append("text")
            .attr({ "class": "x label","text-anchor" : "end", "x" : width / 2, "y" : height - 6})
            .text(VIZ.constants('xlabel'));

        // Add a y-axis label.
        svg.append("text")
            .attr({"class":"y label","text-anchor": "end", "y": 6, "dy":".75em", "transform":"rotate(-90)"})
            .text(VIZ.constants('ylabel'));

        

        // Add the year label; the value is set on transition.
        var label = svg.append("text")
            .attr({"class":"year label", "text-anchor":"end", "y": height - 24, "x": width/2})
            .text('01/01/2013');

        // A bisector since many nation's data is sparsely-defined.
        var bisect = d3.bisector(function(d) { return d[0]; });

        // Add a dot per nation. Initialize the data at 1800, and set the colors.
        var dot = svg.append("g")
                        .attr("class", "dots")
                        .selectAll(".dot")
                        .data(interpolateData(20130124))
                        .enter().append("circle")
                        .attr("class", "dot")
                        .style("fill", function(d) { return colorScale(color(d)); })
                        .call(position)
                        .sort(order);

        // Add a title.
        dot.append("title")
            .text(function(d) { return d.Symbol; });

    
        // Add an overlay for the year label.
        var box = label.node().getBBox();

        var overlay = svg.append("rect")
            .attr({"class": "overlay","x": box.x, "y": box.y,"width": box.width,"height": box.height})
            .on("mouseover", enableInteraction);
        
        console.log(moment('20130124','YYYYMMDD').unix());
        
        // Start a transition that interpolates the data based on year.
        svg.transition()
            .duration(200000)
            .ease("linear")
            .tween("year", tweenYear)
            .each("end", enableInteraction);

        // Positions the dots based on data.
        function position(dot) {
            dot.attr("cx", function(d) {
                    // console.log('xScale(x(d))', xScale(x(d)));
                    return xScale(x(d)); })
               .attr("cy", function(d) {
                    // console.log(' yScale(y(d))',  y(d));
                    return yScale(y(d)); })
                    // return 100;})
    
               .attr("r", function(d) {
                    // console.log('radiusScale(radius(d))', radiusScale(radius(d)));
                    return radiusScale(radius(d));
            });
        }

        // Defines a sort order so that the smallest dots are drawn on top.
        function order(a, b) {
            return radius(b) - radius(a);
        }

        // After the transition finishes, you can mouseover to change the year.
        function enableInteraction() {
            

            var yearScale = d3.time.scale()
                .domain([moment("20130430","YYYYMMDD").format("YYYY-MM-DD"), moment("20130502","YYYYMMDD").format("YYYY-MM-DD")])
                .range([box.x + 10, box.x + box.width - 10])
                .clamp(true),

            mouseover = function() {
                label.classed("active", true);
            },

            mouseout = function () {
                label.classed("active", false);
            },

            mousemove = function () {
                console.log(d3.mouse(this)[0]);
                displayYear(yearScale.invert(d3.mouse(this)[0]));
            };
            // Cancel the current transition, if any.
            svg.transition().duration(0);

            overlay
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("mousemove", mousemove)
                .on("touchmove", mousemove);
        }

        // Tweens the entire chart by first tweening the year, and then the data.
        // For the interpolated data, the dots and label are redrawn.
        function tweenYear() {
            //var year = d3.interpolateNumber(20130430, 20130502);
            var year = d3.interpolateNumber(1356998400,1370995200);
            
            return function(t) {
                
                var yearFormatted = moment.unix(year(t)).format('YYYYMMDD');
                
                displayYear(yearFormatted);
            };
        }

        // Updates the display to show the specified year.
          function displayYear(year) {
            console.log(year);
            dot.data(interpolateData(year), key).call(position).sort(order);
            label.text(Math.round(year));
          }


        // Interpolates the dataset for the given (fractional) year.
        function interpolateData(year) {
            return stocks.map(function(d) {
                return {
                    Symbol: d.Symbol,
                    Color: d.Symbol,
                    Returns: interpolateValues(d.Returns, year),
                    Volume: interpolateValues(d.Volume, year),
                    ClosePrice: interpolateValues(d.ClosePrice, year)
                };
            });
        }

        // Finds (and possibly interpolates) the value for the specified year.
        function interpolateValues(values, year) {
            var i = bisect.left(values, year, 0, values.length - 1),
                a = values[i];
            if (i > 0) {
              var b = values[i - 1],
                  t = (year - a[0]) / (b[0] - a[0]);
              return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
        }

    };

   

    //APP Start
    var appModel = new VIZ.Model();

    appModel.getData().done(function(){
        console.log(appModel.model);
        new VIZ.StockView(appModel.model);
    }).fail(function(){
        console.log('error fetching data');
    });

})(window, jQuery, d3);