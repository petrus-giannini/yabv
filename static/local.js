var session = {};

const Constants = {   
	APP_PATH    : "D:/desk/eustema/BCR/!newBCR/bcrtest/Github Bulletin List", 	  // path assoluto dell'applicazione
	WEB_PATH    : "",                  // path del redirect, per esempio se nginx esegue il redirect http://host/consoleBCR la costante sarà "/consoleBCR"
	// porta di ascolto
	LISTENFROM  : 4005,
	TIMEOUT_MS : 30000,
	// token github petrus-giannini
	LINK  : {
		BCR : {
			REPO_URL  : "https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/git/trees/master:files",
			DOWNLOAD_URL : "https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/master/files/",
			MAP_URL : "https://servizio-mappe.protezionecivile.it/#/view/dashboard?x=13.0&y=41.5&zoom=6.5&basemap=GOOGLE_SATELLITE&appname=Bollettino%20di%20Criticità"
		},
		BV  : {
			REPO_URL   : "https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Vigilanza-Meteorologica/git/trees/master:files",
			DOWNLOAD_URL : "https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Vigilanza-Meteorologica/master/files/",
			MAP_URL  : "https://servizio-mappe.protezionecivile.it/#/view/dashboard?x=13.0&y=41.5&zoom=6.5&basemap=OPEN_STREET_MAP&appname=Bollettino%20di%20Vigilanza"
		}
	}	
};

function go(bulletin){
	
	let blt = bulletin.toUpperCase();
	console.log(bulletin);
	
	//richiede
	var getHeaders = {
		'Content-Type' : 'application/json',
	};

	var getOptions = {
	    'headers': getHeaders,
	    'timeout': Constants.TIMEOUT_MS
	};

		try {
		
			axios.get(Constants.LINK[blt].REPO_URL, getOptions)
			 	.then (function (response){
			 		if (response.status >= 200 && response.status < 209){
			 			listDone = true
				 		var theList = response.data
						if (theList) {
							theList.tree = theList.tree.sort((a,b) => {
								return (a.path < b.path) ? 1 : (a.path > b.path) ? -1 : 0; 
							});
							session[blt] = {};
							session[blt].theList = reduceList(theList.tree, blt); 
							renderListPage(blt, session[blt].theList);
						} else {
					    	let err = "Errore durante richiesta lista file a Github: manca il response.data";
							msg = {"success":0, "message": err}
			                return;
						}
			 		} else {
				    	let err = "Errore durante richiesta lista file a Github: ";
						msg = {"success":0, "message": err}
		                return;
			 		}
			 	})
				.catch(function (error) {
			    	console.error("Errore durante richiesta lista file a Github: " + error);
	                return;
				});
			
			} catch (e) {
				console.error("entrato in catch");
				console.error(e);
			}


}

function reduceList(gottenList, repo){
	return gottenList.map(b => {
		if (b.type == 'blob' && b.path.endsWith(".json")){
			let theLink = Constants.LINK[repo].MAP_URL + "&file=" + Constants.LINK[repo].DOWNLOAD_URL + b.path;
			let theDateString = b.path.replace(".json","");
			let theLinks = [
				{label: "Giornaliero",  link : theLink + "&fase=today"},
				{label: "A un giorno",  link : theLink + "&fase=tomorrow"}
			];
			
			if (repo == "BV") {
				theLinks.push({
					label: "A due giorni",  link : theLink + "&fase=aftertomorrow"
				})
			} 
			
			let theDataLinks = [];
			if (repo == "BV") {
				theDataLinks = [
					{label: "PDF", link: Constants.LINK[repo].DOWNLOAD_URL + "pdf/" + theDateString + ".zip"},
					{label: "SHP", link: Constants.LINK[repo].DOWNLOAD_URL + "shp/" + theDateString + ".zip"},
					{label: "XML", link: Constants.LINK[repo].DOWNLOAD_URL + "xml/" + theDateString + ".zip"},
					{label: "ALL", link: Constants.LINK[repo].DOWNLOAD_URL + "all/" + theDateString + ".zip"},
				]
			} else {
				theDataLinks = [
					{label: "PDF", link: Constants.LINK[repo].DOWNLOAD_URL + "pdf/" + theDateString + ".zip"},
					{label: "SHP", link: Constants.LINK[repo].DOWNLOAD_URL + "shp/" + theDateString + "_shp.zip"},
					{label: "XML", link: Constants.LINK[repo].DOWNLOAD_URL + "xml/" + theDateString + ".zip"},
					{label: "ALL", link: Constants.LINK[repo].DOWNLOAD_URL + "all/" + theDateString + "_all.zip"},
				]
			}
					
			return {
				name: b.path,
				datestring: theDateString, 
				link: theLinks,
				datalink: theDataLinks
			};
		}
	}).filter(i => i!=null);
}

function renderListPage(repo, list){
	let html = "";
	$('#theListDiv').empty();
	list.forEach(i => {
		html += '<div class="px-custom"><div class="row">';
		html += '<div class="col-12">';
		html += "<h4>" + getHumanDateString(i.datestring) + "</h4>";	
		html += '</div>';
		
		i.link.forEach(l => {
			html += '<div class="col-2">';
			html += "<a href='" + l.link + "'>" + l.label + "</a><br />";
			html += '</div>';
		})
		
		i.datalink.forEach(l => {
			html += '<div class="col-1">';
			html += "<a href='" + l.link + "'>" + l.label + "</a><br />";
			html += '</div>';
		})
		
		html += '</div></div>';
	}); 
	$('#theListDiv').html(html);
}

function getHumanDateString(datestr){
	const months = {
		"01" : "gennaio",
		"02" : "febbraio",
		"03" : "marzo",
		"04" : "aprile",
		"05" : "maggio",
		"06" : "Giugno",
		"07" : "luglio",
		"08" : "agosto",
		"09" : "settembre",
		"10" : "ottobre",
		"11" : "novembre",
		"12" : "dicembre"
	};
	if (datestr.length > 8) {
		// bcr yyyymmdd_hhmm
		return `Bollettino di Criticità del ${datestr.substr(6,2)} ${months[datestr.substr(4,2)]} ${datestr.substr(0,4)} ore ${datestr.substr(9,2)}:${datestr.substr(11,2)}`;
	} else {
		// bv yyyymmdd
		return `Bollettino di Vigilanza Meteorologica Nazionale del ${datestr.substr(6,2)} ${months[datestr.substr(4,2)]} ${datestr.substr(0,4)}`;
	}
}
