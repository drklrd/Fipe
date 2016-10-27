'use strict';


var remote = require('electron').remote;
var fs = remote.require('fs');
var http = remote.require('http');
var https = remote.require('https');
var url = remote.require('url');
var dialog = remote.dialog;


// var cp = remote.require('child_process').exec('halt -p', console.log);
var file = [],
	request = [],
	ongoing = [],
	progess = [],
	bar = [],
	completed = [],
	saveAt = [];

var enableAccessoryButtons = (id)=>{
	
	document.getElementById('pause_button_'+id).disabled= false;
	document.getElementById('resume_button_'+id).disabled= false;
	document.getElementById('initiatebutton_'+id).disabled= true;

}	
var initiateDownload = (e) => {
	var id = e.id.split('_')[1];
	var fileToDownload = document.getElementById('file_to_download_' + id).value;
	if (fileToDownload && fileToDownload.length) {



		var newPath = dialog.showOpenDialog({
			properties: ['openDirectory', 'createDirectory']
		});

		if(newPath && newPath.length){
			document.getElementById('progress_bar_' + id).innerHTML = 'Initiating...';
			var received_bytes = 0;
			var total_bytes = 0;
			var fileUrl = fileToDownload;
			try {
				var fileName = url.parse(fileUrl).pathname.split('/').pop();
				saveAt[id] = newPath[0] + '/' + fileName;
				file[id] = fs.createWriteStream(saveAt[id]);
				var protocol = fileUrl.split('://')[0] === "http" ? http : https;
			}
			catch(err){
				console.log(err);
			}

			try {
				request[id] = protocol.get(fileUrl, function(response) {
					if(response.statusCode === 200){
						enableAccessoryButtons(id);
						total_bytes = parseInt(response.headers['content-length']);
						response.pipe(file[id]);
						ongoing[id] = response;
						completed[id] = 0;

						response.on('data', function(chunk) {
							received_bytes += chunk.length;
							progess[id] = Math.floor((received_bytes / total_bytes) * 100);
							var progressColor;
							if (progess[id] < 20) {
								progressColor = "progress-litte";
							} else if (progess[id] < 50) {
								progressColor = "progress-middle";
							} else if (progess[id] < 85) {
								progressColor = "progress-more";
							} else {
								progressColor = "progress-almost";
							}
							bar[id] = "<div class='progress'> <div class='progress-bar " + progressColor + "' role='progressbar' aria-valuenow='" + received_bytes + "' aria-valuemin='0' aria-valuemax='" + total_bytes + "' style='width:" + progess[id] + "%' > </div> </div>";

							bar[id] += "<div class='pull-right'>" + progess[id] + "%" + "</div>"


							// document.getElementById('progress_bar_'+id).innerHTML = progess[id];
							document.getElementById('progress_bar_' + id).innerHTML = bar[id];



							// console.log(received_bytes, total_bytes, (received_bytes / total_bytes) * 100)
						});

						response.on('end', function() {
							completed[id] = 1;
							var completedText = '<b><span class="glyphicon glyphicon-ok done-tick"></span> Completed</b>';
							completedText += "<br>";
							completedText += "Downloaded to : " + saveAt[id];
							completedText += "<br>";
							document.getElementById('progress_bar_' + id).innerHTML = completedText;
						})

					}else{
						document.getElementById('progress_bar_' + id).innerHTML = 'Error downloading. Please ensure that the link in correct';
					}
					


				})
			}

			catch(err){
				document.getElementById('progress_bar_' + id).innerHTML = 'Error downloading. Please ensure that the link in correct';
			}
			

		}

		
	}

}



var pause = (e) => {
	ongoing[e.id.split('_')[1]].pause();

}

var resume = (e) => {
	ongoing[e.id.split('_')[1]].resume();
}



var queueElements = 0;



var addQueue = () => {
	queueElements++;
	var queueInput = "<div id='list_" + queueElements + "'>";
	queueInput += "<br>";
	queueInput += '<input placeholder="Copy file URL here" class="form-control" type="text" name="fileToDownload" id="file_to_download_' + queueElements + '">';
	queueInput += "<button class='btn btn-info' onclick='initiateDownload(this)' id='initiatebutton_" + queueElements + "'> <span class='glyphicon glyphicon-play'></span> Start Download </button>";
	queueInput += "<button class='btn btn-info' disabled='true' onclick='pause(this)' id='pause_button_" + queueElements + "'> <span class='glyphicon glyphicon-pause'></span> Pause Download </button>";
	queueInput += "<button class='btn btn-info' disabled='true' onclick='resume(this)' id='resume_button_" + queueElements + "'> <span class='glyphicon glyphicon-refresh'></span> Resume Download </button>";
	queueInput += "<button class='btn btn-info pull-right' onclick='deleteFn(this)' id='delete_button_" + queueElements + "'> <span class='glyphicon glyphicon-remove '></span>  </button>";
	// queueInput += "<button onclick='queue(this)' id='button_"+queueElements+"'> This button </button>";
	queueInput += "<p>";
	queueInput += "<div id='progress_bar_" + queueElements + "'></div>";
	queueInput += "<br>";
	queueInput += "</div>";

	var newElement = document.createElement('div');
	newElement.innerHTML = queueInput;
	document.getElementById("queue_list").appendChild(newElement);


}

var nullifyNodes = (nodes, id) => {

	if (nodes && nodes.length) {
		nodes.forEach((node) => {
			if (node[id]) {
				node[id] = undefined;
			}
		})
	}

	return;
}

var deleteFn = (e) => {


	var id = e.id.split('_')[1];
	var elem = document.getElementById('list_' + id);
	elem.parentNode.removeChild(elem);

	nullifyNodes(file, request, ongoing, progess, bar, completed);

}

var autoShutState = false;

var autoShutToggle = () => {
	autoShutState = autoShutState ? false : true;
	// console.log('autoShutToggle', autoShutState);
}

var checkAutoShutDownEnabled = () => {

	if (completed && completed.length) {
		// console.log('Checked !', completed);
		var taskPending = false;
		completed.forEach(function(statusEach) {
			if (statusEach === 0) {
				taskPending = true;
			}
		})
		if (!taskPending) {
			// console.log('All Task COmpleted YAYAYY');
			document.getElementById('message_body').innerHTML = "<b><section class='content font-40'> <span class='glyphicon glyphicon-log-out'></span> Initiating shutdown...</section></b>";
			document.getElementById('whole_body').innerHTML = "";
			
			setTimeout(()=> {
				console.log('SHUTDOWN !');
			}, 5000);
		} else {
			// console.log('All task Not Completed');
		}
	}

}

setInterval(function() {
	checkAutoShutDownEnabled();
}, 5000);