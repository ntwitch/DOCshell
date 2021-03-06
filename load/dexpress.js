/*
 * dexpress.js
 * by: Damon Getsman
 * started: 12oct14 (lol I'm 37 today; lawd the helpless aging)
 * finished;
 *
 * Handles text entry and the like for the ddoc suite's express message
 * functionality
 *
 * Please note that this also contains the wholist array collection
 * method functionality (in order to select appropriate recipients, etc)
 */

load("sbbsdefs.js");

/*
 * BUGS:
 *
 * At this point there is still no duplicate user checking; this should
 * probably be taken care of at some point.
 */

wholist = {
  /*
   * summary:
   *	Cycles through system's nodes, checking to see if they're in use
   *	and then compiling an array of the usernames
   * returns:
   *	Array() of User objects
   */
  populate : function() {
	var ul = new Array();
	var tu = 0;

	for (var n = 0; n < system.nodes; n++) {
	  if (system.node_list[n] && NODE_INUSE) {
		ul[tu++] = User(system.node_list[n].useron);
	  }
	}

	if (debugging) {
	  console.putmsg(red + "Debugging wholist.populate():\n");
	  for each (cu in ul) {
	    console.putmsg(blue + high_intensity + cu.alias + " ");
	  }
	  console.putmsg("\n");
	}

	return ul;
  },
  /*
   * summary:
   *	No longer simply a wrapper for Synchronet's whos_online() method,
   *	this is now going to implement the long wholist features from
   *	vDOC as completely as possible, complete with 'd'oing field display
   *	enabled easily by ntwitch's modifications
   * ul:
   *	Array() of User objects for those currently online
   * NOTE: This needs to be less of a monolith
   */
  list_long : function(ul) {
	var timeon;

	//time to do this the right way
	bbs.log_key("w");

	//header
	console.putmsg(green + high_intensity + "There are " + yellow +
	  ul.length + green + " users (no queue here)\n\n" + yellow +
	  "User Name\t" + magenta + "From\t\t" + red + "Time\t" +
	  cyan + "Doing\n");
	for (var ouah = 0; ouah < (console.screen_columns - 2); ouah++) {
	  console.putmsg(green + high_intensity + "-");
	}
	console.putmsg("\n");
	  
	for each (u in ul) {
	  var skip = false;
	  //skip if this is an unused node
	  if (u.alias.length < 3) {
	    skip = true;
	  }

	  if (!skip) {
	    var tabsInUname;

	    console.putmsg(yellow + high_intensity + u.alias);

	    /* tabsInUname = (u.alias.length % 8);
	    while (tabsInUname < 3) {
		console.putmsg("\t");
		tabsInUname++;
	    } */
	    if (u.alias.length < 8) {
		console.putmsg("\t");
	    }
	    //console.putmsg("\t");

	    //how much to get to tabstop?
	    console.putmsg("\t" + cyan + high_intensity + u.ip_address);
	    console.putmsg("\t");

	    //time online
	    timeon = time() - u.logontime;
	    console.putmsg(red + high_intensity + 
	      ((timeon - (timeon % 60)) / 60) + ":");
	    if ((timeon % 60) < 10) {
		console.putmsg(red + high_intensity + "0" + (timeon % 60) +
		"\t");
	    } else {
		console.putmsg(red + high_intensity + (timeon % 60) + "\t");
	    }

	    //doing
	    console.putmsg(cyan + high_intensity + 
		userRecords.userDataIO.loadSettings(u.number).doing + "\n");
	  }
	}

	//this is the easy one
	//NOTE: We're going to be changing this in the future to show
	//doing fields, though, which will require a custom rewrite
	/*bbs.log_key("w");
	bbs.whos_online(); */
  },
  /*
   * summary:
   *	Displays a shorter (multicolumn, though spacing isn't perfectly
   *	figured out on that yet) format listing of who is online
   * ul:
   *	Array() of User objects for those currently online
   */
  list_short : function(ul) {
	//this one we'll have to make multi-column
	var uNames = new Array();
	var maxArrayLen = 0, totalUsers = 0, cols, ouah2, colBoundary;

	bbs.log_key("W");
	console.putmsg(green + high_intensity + 
	  "\nWholist (Short)\n---------------\n");

	for (var ouah = 0; ouah < ul.length; ouah++) {
	  uNames[ouah] = ul[ouah].alias;
	  if (uNames[ouah].length > maxArrayLen) {
	    maxArrayLen = uNames[ouah].length;
	  }
	  totalUsers++;
	}

	//this looks a little fugly, but it just adds 2 spaces to the longest
	//name, determines where the nearest tab beyond is, and divides the
	//available screen columns into that many segments accordingly
	colBoundary = ((((maxArrayLen + 2) % 8) + 1) * 8);
	cols = Math.round(console.screen_columns / colBoundary);

	//generate wholist
	for (var ouah = 0; ouah < totalUsers; ouah++) {
	  console.putmsg(green + high_intensity + uNames[ouah]);

	  //set the cursor to the right position for next
	  ouah2 = console.getxy();
	  if ((ouah2.x + colBoundary) >= (console.screen_columns + 8)) {
		console.putmsg("\n");
	  } else {
		console.putmsg("\t\t");
	  }

	  //pretty sure the above replaces this right now
	  /* if ((ouah > 0) && ((ouah % cols) == 0)) {
		console.putmsg("\n");
	  } */
	}

	console.putmsg("\n");
  }
},
express = {
  	/*
	 * summary:
	 *	Reads in a buffer of up to 5 77 column lines, checking
	 *	each line for end-of-input criteria (ie ABORT, or a
	 *	blank line prematurely), sending it off to be sent via a
	 *	Synchronet telegram by the calling routine
	 * returns:
	 *	null if aborted; an array of Strings, with up to 5
	 *	elements.  Assume nothing else.
	 */
  readBuf : function() {
	var abort = false, nao = new Date, mTxt = new Array, xHdr;

	xHdr = green + "Xpress message from " + high_intensity +
		user.alias + normal + green + " sent at " +
		yellow + high_intensity + nao.toString() + 
		"\n" + green + high_intensity + "-=-=-=-=-=-=-=-\n";

	//heading should've already been taken care of
	for (var ouah = 0; ouah < 5; ouah++) {
	  console.putmsg(green + "> ");
	  if (ouah < 4) {
	    mTxt[ouah] = console.getstr("", 77, K_WRAP);
	  } else {
	    mTxt[ouah] = console.getstr("", 77);
	  }

	  if (((mTxt[ouah].toUpperCase() == "ABORT") ||
	       (mTxt[ouah].toUpperCase() == "ABORT\r")) ||
	      (((mTxt[ouah] == "\r") || (mTxt[ouah] == "")) && 
		(ouah == 0))) {
	    abort = true; break;
	  } else if ((mTxt[ouah] == "") || (mTxt[ouah] == "\r")) {
	    //didn't fill up all 5 lines, but done
	    if (ouah == 0) { abort = true; }
	    break;	//will require post-processing to avoid sending
			//all 5 of those lines
	  }
	}

	if (abort) {
	  return null;
	} else {
	  var full = xHdr;

	  full += (green + high_intensity);
	  for each (xLine in mTxt) {
		if (xLine === ",") {
		  //wut the fuck is this?
		  break;
		}
		full += (xLine + "\n");
	  }
	  full += "\n";

	  return (full);
		//postprocessing elsewhere, gotta hurry up 2nite
	}
  },
  /*
   * summary:
   *	Executes the portion of the express message to [recipient]
   *	interface for 'X' functionality.  Upon the user's entry of the
   *	recipient's name, it verifies whether or not the user is logged
   *	in/valid in general.  More functionality will be added as the
   *	skeleton is first implemented.
   * returns:
   *	Negative value for user not found, zero for success
   */
  chkRcp : function(ul) {
	//check to make sure the recipient is valid
	var recip = null, success = false;

	console.putmsg(green + "Message eXpress\nRecipient: ");
	//note that a default user from previous expresses will
	//have to be added here to keep people from bitching

	recip = console.getstr();
	for each (u in ul) {
	  if (u.alias.toUpperCase() == recip.toUpperCase()) {
	    success = true;
	    return u.alias;
	  }
	}

	//offline?
	if ((!success) && (system.matchuser(recip) == 0)) {
	  //not found
	  console.putmsg(red + high_intensity +
		"User record not found\n" + green);
	  return -1;
	} else {
	  //user offline
	  //NOTE: there will have to be a better solution here; ie add a
	  //telegram to the user though they're offline
	  console.putmsg(yellow + high_intensity +
		"User is currently offline; try Mail>\n" +
		green);
	  return 0;
	}
  },
  /*
   * summary:
   *	The enclosing logic for the entire Xpress message sending
   *	routine, from 'x' at the main menu, as well as from any other
   *	area where it will be implemented (ie message save menus,
   *	message read menus, etc)
   * returns:
   *	Negative value for fuggup
   */
  sendX : function() {
	var recip, mTxt;

	docIface.setNodeAction(NODE_CHAT);

	//turn off incoming messages for a bit
	bbs.sys_status |= SS_MOFF;

	recip = express.chkRcp(wholist.populate());
	if (recip <= 0) {
	  //oopthieoopth!
	  return -1;
	}

	mTxt = express.readBuf();
	
	if (mTxt != null) {
	  bbs.log_key("x");
	  system.put_telegram(system.matchuser(recip), mTxt);
	  console.putmsg(green + "Message sent!\n");
	}

	//turn incoming messages back on
	bbs.sys_status ^= SS_MOFF;
  }
}
