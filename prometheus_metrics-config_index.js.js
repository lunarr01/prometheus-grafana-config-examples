// Require and call Express
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var responseTime = require('response-time'); // Add variable for response time for npm
const prom = require('prom-client'); // Add
const collectDefaultMetrics = prom.collectDefaultMetrics; // For enabling the collection of default metrics - enable default metric scraping


// Metric Definitions
const tasksadded = new prom.Counter({ //tasksadded is a generic name for this lab
  name: 'forethought_tasks_added',

// Add another variable for the tasks complete metric
const tasksdone = new prom.Counter({
  name: 'forethought_tasks_complete',
  help: 'The number of items completed'
});

// Add a variable for Tasks Guage monitoring requirement
const taskgauge = new prom.Gauge({
  name: 'forethought_current_tasks',
  help: 'Amount of incomplete tasks'
});

// Response time summary variable
const responsetimesumm = new prom.Summary ({
  name: 'forethought_response_time_summary',
  help: 'Latency in percentiles',
});
// variable for the response time Histogram
const responsetimehist = new prom.Histogram ({
  name: 'forethought_response_time_histogram',
  help: 'Latency in history form',
});

collectDefaultMetrics({ prefix: 'forethought_' });

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// use css
app.use(express.static("public"));

// placeholder tasks
var task = [];
var complete = [];

// add a task
app.post("/addtask", function(req, res) {
  var newTask = req.body.newtask;
  task.push(newTask);
  res.redirect("/");
  tasksadded.inc(); // Add task to reference the const variable you created for scraping the Metrics
  taskguage.inc(); // Count up everytime there is a new task.  this will be the guage
});

// remove a task
app.post("/removetask", function(req, res) {
  var completeTask = req.body.check;
  if (typeof completeTask === "string") {
    complete.push(completeTask);
    task.splice(task.indexOf(completeTask), 1);
  }
  else if (typeof completeTask === "object") {
    for (var i = 0; i < completeTask.length; i++) {
      complete.push(completeTask[i]);
      task.splice(task.indexOf(completeTask[i]), 1);
      tasksdone.inc(); // This is keeping track of the increase in tasks Metric
      tasksguage.dec(); // This is keeping track of the decrease in tasks Metric
     }
  }
  res.redirect("/");
});

// tracking response time Here we are calling our application and doing something with it
app.use(responseTime(function (req, res, time) {
  responsetimesumm.observe(time);
  responsetimehist.observe(time); // calls the histogram
}));


// get website files
app.get("/", function (req, res) {
  res.render("index", { task: task, complete: complete });
});
// Section below for creating a /metrics endpoint and call in the Prometheus data
app.get('/metrics', function (req, res) {
          res.set('Content-Type' , prom.register.contentType);
          re.end(prom.register.metrics());
});
// listen for connections
app.listen(8080, function() {
  console.log('Testing app listening on port 8080')
});