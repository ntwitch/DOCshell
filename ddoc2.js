/* rudimentary DOC interface; utilizing OO implementation nao */
/*
 * ddoc2.js
 *
 * by: Damon Getsman
 * started: 18aug14
 * alpha phase: 25oct14
 * beta phase: 
 * finished:
 *
 * a slightly more organized attempt to emulate the DOC shell from
 * within Synchronet's SSJS libraries and functionality
 */

//includes
load("dmbase.js");
load("dpoast.js");
load("dexpress.js");

//pseudo-globals
const debugging = true, excuse = "\n\nNot so fast . . .\n\n",
	debugOnly = false, confine_messagebase = true, topebaseno = 6;

//a few easier hooks for the ctrl-a codes
const ctrl_a = "\1";
const green = ctrl_a + "g", yellow = ctrl_a + "y", blue = ctrl_a + "b",
        white = ctrl_a + "w", red = ctrl_a + "r", cyan = ctrl_a + "c",
        magenta = ctrl_a + "m", high_intensity = ctrl_a + "h",
	normal = ctrl_a + "n";

var stillAlive = true;	//ask for advice on the 'right' way to do this

//cut out the new debugging routine from here to move to ddebug.js
docIface = {
  //top level menu
  //menu properties
  menu :  green + high_intensity +
       //$ctrl_a + "g" + "\n" + "<A>\tSysop commands\n" +
       "\n\n<B>\tChange eXpress beeps\n<b>\tRead forum backward\n" +
       "<C>\tConfig menu\n<D>\tchange Doing field\n" +
       "<^E>\tEnter message with header\n<e>\tenter message normally" +
       "\n<E>\tenter (upload)\n<f>\tread forum forward\n" +
       "<F>\tshow Fortune\n<G>\tGoto next room\n" +
       "<Q>\tAsk a question of a guide\n<i>\tforum information\n" +
       "<j>\tjump to a room name/number\n<k>\tknown rooms list\n" +
       "<l>\tlogout\n<n>\tread new msgs\n<o>\tread old msgs reverse" +
       "\n<p>\tprofile user\n<P>\tprofile user (full info)\n" +
       "<s>\tskip room\n<S>\tskip to\n<t>\tCurrent time\n" +
       "<u>\tungoto last room\n<v>\texpress -1\n<w>\tWho's online?\n" +
       "<W>\tshort wholist\n<x>\tsend eXpress message\n" +
       "<X>\ttoggle eXpress status\n<^X>\tcheck old X messages\n" +
       "<y>\tyell\n<z>\tzaproom\n<0-9>\tquickX\n<#>\tRead room by " +
       "number\n<->\tread last n messages\n<%>\ttoggle guideflag " +
       "status\n<@>\taidelist\n<\">\tquote Xes to Sysop\n\n",
  //		----++++****====menu methods====****++++----
  /*
   * summary:
   *	Just a wrapper for console.getkey() at this point
   * returns:
   *	Unmodified return value from console.getkey()
   */
  getChoice : function() {
	return (console.getkey());
  },
  /*
   * summary:
   *	Simply displays the docIface top level property 'menu'
   */
  doMainMenu : function() {
	console.putmsg(this.menu);
  },

  //sub-objects
  nav : {
	/*
	 * summary:
	 *	Displays the prompt for a string to search for in the
	 *	available message sub-boards, executes a call to the
	 *	functionality to search for it and find it, and jumps to
	 *	it, if available (via yet another call)
	 * returns:
	 *	boolean true or false regarding success in finding the
	 *	string and executing the sub-board change; not sure if
	 *	there will be a reason to test for it or not
	 */
    jump : function() {
	var uChoice, ouah;

	console.putmsg(green + high_intensity + "Jump to forum " +
	  "name? -> ");
	ouah = this.chk4Room(uChoice = console.getstr().toUpperCase());

	if (debugging) {
	  console.putmsg("Got back " + ouah.name + " from chk4Room\n");
	}

	if (ouah == null) {
	  console.putmsg(red + "No list returned\n");
	  return -1;
	} else if (ouah == -1) {
	  console.putmsg(yellow + high_intensity + "Room not found\n");
	  return -2;
	} else {
	  //let's go
	  bbs.cursub_code = ouah.code;	//try/catch?
	}
    },
	/*
	 * summary:
	 *	Searches for the substring within the list of available 
	 *	sub-boards
	 * srchStr:
	 *	Substring to search for
	 * returns:
	 *	The object for the sub-board if a match, null if rList
	 *	doesn't come back decently, -1 if no match is found
	 *	within a valid list
	 */
    chk4Room : function (srchStr) {
	var rList = docIface.util.getRoomList(true);

	if (rList == null) {
	  return null;
	}

	for each (var rm in rList) {
	  if (rm.description.toUpperCase().indexOf(
				srchStr.toUpperCase()) != -1) {
		if (debugging) {
		  console.putmsg("Success in chk4Room()\n");
		}
		return rm;	
	  }
	}

	//bad failover method, but whatever
	return -1;
    }
  },
  util : {
	/*
	 * summary:
	 *	Returns an array of message rooms that are
	 *	accessible; this will be extended as functionality for
	 *	not being confined is expanded.  Also, this may be
	 *	useful in the future for listKnown() and other routines
	 *	in dmbase.js that are recreating the wheel a bit
	 * confined:
	 *	Same as usual; boolean showing whether or not we're in a
	 *	confined instance of ddoc
	 * returns:
	 *	As I redundantly and out-of-proper-orderly mentioned
	 *	above, it returns an array of sub-board objects
	 *	If running non-confined, returns null
	 */
    getRoomList : function(confined /*in the future, group here too*/) {
	if (confined) {
	  	//damn we don't need anything complex, durrr
		if (debugging) {
		  console.putmsg("working with sub list: " +
			msg_area.grp_list[topebaseno].sub_list.toString());
		}
		return msg_area.grp_list[topebaseno].sub_list;
	} else {
		return null;
	}
    }
  }
}

//		---+++***===Execution Begins===***+++---

var preSubBoard, preFileDir;
var uchoice;

//save initial conditions
preSubBoard = user.cursub;
preFileDir = user.curdir;

if (confine_messagebase && (bbs.curgrp != topebaseno) && debugging) {
  //are we already in a dystopian area?
	console.putmsg(red + "CurGrp: " + bbs.curgrp + normal + "\n" +
		       "Trying a jump . . .\n");
	bbs.curgrp = topebaseno;
} else if (confine_messagebase && (bbs.curgrp != topebaseno)) {
	bbs.curgrp = topebaseno;
}

if (!debugOnly) {
 /* the main program loop */
 while (stillAlive) {
	//dynamic prompt
	dprompt = yellow + high_intensity + 
	  msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].description
	  + "> ";

	//maintenance
	bbs.main_cmds++;
	
	//check for async messages waiting
	bbs.nodesync();

	console.putmsg(dprompt);
	uchoice = docIface.getChoice();
	//poor aliasing
	if (uchoice == ' ') {
	  uchoice = 'n';
	}

	switch (uchoice) {
		//top menu
		case '?' :
		  docIface.doMainMenu();
		  break;
		//message base entry commands
		case 'b':
		case 'e':
		case 'E':
		case 'r':
		case 'n':
		case 'o':
		case '-':
		  msg_base.entry_level.handler(uchoice, confine_messagebase);
		  break;
		//other msg base shit
		case 'j':
		//jump to new sub-board (room in DOCspeak)
		  docIface.nav.jump();
		  break;
		//list known
		case 'k':
		  msg_base.entry_level.listKnown(confine_messagebase);
		  break;
		//logout
		case 'l':
		  console.putmsg(yellow + high_intensity + "Logout: \n");
		  if (!console.noyes("Are you sure? ")) {
		    if (debugging) {
		      console.putmsg("\n\nExiting: " + excuse);
		    }
		    stillAlive = false;
		  } else {
		    console.putmsg(green + high_intensity +
			"Good choice.  ;)\n");
		  }
		  break;
		case 'w':
		  wholist.list_long();
		  break;
		case 'x':
		  express.sendX();
		  break;
		case 'W':
		  wholist.list_short(wholist.populate());
		  break;
		default:
		  console.putmsg(excuse);
		  break;
	}
 }
} else {
 if (dMBTesting.init() != 0) {
	console.putmsg(red + "\n\nFUCK\n\n" + normal);
 } else {
	console.putmsg(yellow + "\nCzech and see if it's where it " +
		       "should be theyah, budday\n\n" + normal);
 }
}

//restore initial setings prior to exit
user.cursub = preSubBoard;
user.curdir = preFileDir;

