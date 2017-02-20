$( pieChart );

function pieChart() {

  var chartSizePercent = 55;
  var sliceBorderWidth = 1;
  var sliceBorderStyle = "#fff";
  var sliceGradientColour = "#ddd";
  var maxPullOutDistance = 25;
  var pullOutFrameStep = 4;
  var pullOutFrameInterval = 40;
  var pullOutLabelPadding = 65;
  var pullOutLabelFont = "bold 16px Georgia";
  var pullOutValueFont = "bold 16px Georgia";
  var pullOutValuePrefix = "";
  var pullOutShadowColour = "rgba( 0, 0, 0, .5 )";
  var pullOutShadowOffsetX = 5;
  var pullOutShadowOffsetY = 5;
  var pullOutShadowBlur = 5;
  var pullOutBorderWidth = 2;
  var pullOutBorderStyle = "#333";
  var chartStartAngle = -.5 * Math.PI;
  var canvas = [];
  var currentPullOutSlice = [-1, -1];
  var currentPullOutDistance = [0, 0];
  var animationId = [0, 0];
  var chartData = [[], []];
  var chartColours = [[], []];
  var totalValue = [0, 0];
  var canvasWidth = [];
  var canvasHeight = [];
  var centreX = [];
  var centreY = [];
  var chartRadius = [];
  var chartId;
  var chartById = ['chart', 'chart1'];
  var chartByData = ['chartData', 'chartData1'];

  $.each(chartById, function(id){
    init(id);
  });

  function init(id) {

    chartId = id;
    canvas[chartId] = document.getElementById(chartById[chartId]);

    if ( typeof canvas[chartId].getContext === 'undefined' ) return;
    canvasWidth[chartId] = canvas[chartId].width;
    canvasHeight[chartId] = canvas[chartId].height;
    centreX[chartId] = canvasWidth[chartId] / 2;
    centreY[chartId] = canvasHeight[chartId] / 2;
    chartRadius[chartId] = Math.min( canvasWidth[chartId], canvasHeight[chartId] ) / 2 * ( chartSizePercent / 100 );
    var currentRow = -1;
    var currentCell = 0;

    $('#'+chartByData[chartId]+' td').each( function() {
      currentCell++;
      if ( currentCell % 2 != 0 ) {
        currentRow++;
        chartData[chartId][currentRow] = [];
        chartData[chartId][currentRow]['label'] = $(this).text();
      } else {
       var value = parseFloat($(this).text());
       totalValue[chartId] += value;
       value = value.toFixed(2);
       chartData[chartId][currentRow]['value'] = value;
      }

      $(this).data( 'slice', currentRow );

      if ( rgb = $(this).css('color').match( /rgb\((\d+), (\d+), (\d+)/) ) {
        chartColours[chartId][currentRow] = [ rgb[1], rgb[2], rgb[3] ];
      } else if ( hex = $(this).css('color').match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/) ) {
        chartColours[chartId][currentRow] = [ parseInt(hex[1],16) ,parseInt(hex[2],16), parseInt(hex[3], 16) ];
      } else return;

    });

    var currentPos = 0;

    for ( var slice in chartData[chartId] ) {
      chartData[chartId][slice]['startAngle'] = 2 * Math.PI * currentPos;
      chartData[chartId][slice]['endAngle'] = 2 * Math.PI * ( currentPos + ( chartData[chartId][slice]['value'] / totalValue[chartId] ) );
      currentPos += chartData[chartId][slice]['value'] / totalValue[chartId];
    }

    drawChart();
    $('#'+chartById[chartId]).click ( handleChartClick );
  }

  function handleChartClick ( clickEvent ) {
      chartId = chartById.indexOf(clickEvent.target.id);
      var mouseX = clickEvent.pageX - this.offsetLeft;
      var mouseY = clickEvent.pageY - this.offsetTop;
      var xFromCentre = mouseX - centreX[chartId];
      var yFromCentre = mouseY - centreY[chartId];
      var distanceFromCentre = Math.sqrt( Math.pow( Math.abs( xFromCentre ), 2 ) + Math.pow( Math.abs( yFromCentre ), 2 ) );
      if ( distanceFromCentre <= chartRadius[chartId] ) {
        var clickAngle = Math.atan2( yFromCentre, xFromCentre ) - chartStartAngle;
        if ( clickAngle < 0 ) clickAngle = 2 * Math.PI + clickAngle;
        for ( var slice in chartData[chartId] ) {
          if ( clickAngle >= chartData[chartId][slice]['startAngle'] && clickAngle <= chartData[chartId][slice]['endAngle'] ) {
            toggleSlice ( slice );
            return;
          }
        }
      }
      pushIn();
  }

  function toggleSlice ( slice ) {
    if ( slice == currentPullOutSlice[0] ) {
      pushIn();
    } else {
      startPullOut ( slice );
    }
  }

  function startPullOut ( slice ) {
    if ( currentPullOutSlice[chartId] == slice ) return;
    currentPullOutSlice[chartId] = slice;
    currentPullOutDistance[chartId] = 0;
    clearInterval( animationId[chartId] );
    animationId[chartId] = setInterval( function() { animatePullOut( slice ); }, pullOutFrameInterval );
  }

  function animatePullOut ( slice ) {
    currentPullOutDistance[chartId] += pullOutFrameStep;
    if ( currentPullOutDistance[chartId] >= maxPullOutDistance ) {
      clearInterval( animationId[chartId] );
      return;
    }
    drawChart();
  }

  function pushIn() {
    currentPullOutSlice[chartId] = -1;
    currentPullOutDistance[chartId] = 0;
    clearInterval( animationId[chartId] );
    drawChart();
    $('#'+chartByData[chartId]+' td').removeClass('highlight');
  }

  function drawChart() {
    var context = canvas[chartId].getContext('2d');
    context.clearRect ( 0, 0, canvasWidth[chartId], canvasHeight[chartId] );
    for ( var slice in chartData[chartId] ) {
      if ( slice != currentPullOutSlice[chartId] ) drawSlice( context, slice );
    }
    if ( currentPullOutSlice[chartId] != -1 ) drawSlice( context, currentPullOutSlice[chartId] );
  }

  function drawSlice ( context, slice ) {
    var startAngle = chartData[chartId][slice]['startAngle']  + chartStartAngle;
    var endAngle = chartData[chartId][slice]['endAngle']  + chartStartAngle;
    if ( slice == currentPullOutSlice[chartId] ) {
      var midAngle = (startAngle + endAngle) / 2;
      var actualPullOutDistance = currentPullOutDistance[chartId] * easeOut( currentPullOutDistance[chartId]/maxPullOutDistance, .8 );
      startX = centreX[chartId] + Math.cos(midAngle) * actualPullOutDistance;
      startY = centreY[chartId] + Math.sin(midAngle) * actualPullOutDistance;
      context.fillStyle = 'rgb(' + chartColours[chartId][slice].join(',') + ')';
      context.textAlign = "center";
      context.font = pullOutLabelFont;
      context.fillText( chartData[chartId][slice]['label'], centreX[chartId] + Math.cos(midAngle) * ( chartRadius[chartId] + maxPullOutDistance + pullOutLabelPadding ), centreY[chartId] + Math.sin(midAngle) * ( chartRadius[chartId] + maxPullOutDistance + pullOutLabelPadding ) );
      context.font = pullOutValueFont;
      context.fillText( pullOutValuePrefix + chartData[chartId][slice]['value'] + " (" + ( parseInt( chartData[chartId][slice]['value'] / totalValue[chartId] * 100 + .5 ) ) +  "%)", centreX[chartId] + Math.cos(midAngle) * ( chartRadius[chartId] + maxPullOutDistance + pullOutLabelPadding ), centreY[chartId] + Math.sin(midAngle) * ( chartRadius[chartId] + maxPullOutDistance + pullOutLabelPadding ) + 20 );
      context.shadowOffsetX = pullOutShadowOffsetX;
      context.shadowOffsetY = pullOutShadowOffsetY;
      context.shadowBlur = pullOutShadowBlur;
    } else {
      startX = centreX[chartId];
      startY = centreY[chartId];
    }

    var sliceGradient = context.createLinearGradient( 0, 0, canvasWidth[chartId]*.75, canvasHeight[chartId]*.75 );
    sliceGradient.addColorStop( 0, sliceGradientColour );
    sliceGradient.addColorStop( 1, 'rgb(' + chartColours[chartId][slice].join(',') + ')' );
    context.beginPath();
    context.moveTo( startX, startY );
    context.arc( startX, startY, chartRadius[chartId], startAngle, endAngle, false );
    context.lineTo( startX, startY );
    context.closePath();
    context.fillStyle = sliceGradient;
    context.shadowColor = ( slice == currentPullOutSlice[chartId] ) ? pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
    context.fill();
    context.shadowColor = "rgba( 0, 0, 0, 0 )";

    if ( slice == currentPullOutSlice[0] ) {
      context.lineWidth = pullOutBorderWidth;
      context.strokeStyle = pullOutBorderStyle;
    } else {
      context.lineWidth = sliceBorderWidth;
      context.strokeStyle = sliceBorderStyle;
    }

    context.stroke();
  }

  function easeOut( ratio, power ) {
    return ( Math.pow ( 1 - ratio, power ) + 1 );
  }

};
