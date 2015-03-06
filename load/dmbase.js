/*
 * dmbase.js
 *
 * by: Damon Getsman
 * alpha phase: 25oct14
 * beta phase: 
 * started: 21sept14
 * finished:
 *
 * All routines for accessing the message base are ending up here.  I did 
 * try to break it up a bit, but it's still got some monoliths forming in
 * the structures, so there'll be another pass to break it down more once
 * I get it through and into active beta testing. 
 */

load("sbbsdefs.js");
load("dpoast.js");
load("dperuser.js");

//message base menu
msg_base = {
	/*
	 * summary:
	 *	String to prepend before a key is hit and logged to
	 *	signify that it was at this menu
	 */
  log_header : "dDOC Read menu command: ",
        /*
         * summary:
         *      Sub-object representing the message read command menu
         *      properties and methods
         */
  read_cmd : {
        rcMenu : "\n" + green + high_intensity +
          "<?> help         <a>gain           <A>gain (no More prompt)\n" +
          "<b>ack           <D>elete msg      <e>nter msg\n" +
          "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
          "<n>ext           <p>rofile author  <s>top\n" +
          "<w>ho's online   <x>press msg      <X>press on/off\n\n",
        /*
         * summary:
         *      Reads choice for valid selection
         * base: MsgBase object 
         *      currently in use (and opened)
         * ndx: Integer
         *      index of the current message
         * returns:
         *      1 to stop
         *      2 to change direction
         *      0 for message entered successfully or next msg also
         */
        rcChoice : function(base, ndx) {
          var uchoice;
          var valid = false;
          var hollaBack = 0;    //can be used to switch dir, etc

	  if (base == undefined) {
	    throw new docIface.dDocException("base not defined to rcChoice()");
	  }

	  if (userSettings.debug.message_posting) {
	    console.putmsg(red + "rcChoice() called w/base: " + base.cfg.code +
		"\tndx: " + ndx + "\n");
	  }

          while (!valid) {
	    bbs.nodesync();	//check for xpress messages

            uchoice = console.getkey();
            switch (uchoice) {
                case '?':
                case 'h':
                  console.putmsg(this.rcMenu);
                  break;
                case 'a':
                case 'A':
                  console.putmsg(yellow + "Not supported (yet)" +
                        "...\n");
                  break;
                case 'b':
                  valid = true; hollaBack = 2;
		  docIface.log_str_n_char(this.log_header, 'b');
                  console.putmsg(green + "Back (change " +
                        "direction)...\n");
                  break;
                case 'D':
                case 'i':
                case 'p':
                case 'w':
                  console.putmsg(yellow + "Not supported (yet)" +
                        "...\n");
                  break;
                case 'E':
                  //dispMsg();  //how to pass parameters?
                  console.putmsg(red + "\nI'm too dumb yet, just " +
				 "wait\n");
                  break;
                case 's':
                  valid = true; hollaBack = 1;
		  docIface.log_str_n_char(this.log_header, 's');
                  console.putmsg(yellow + high_intensity + "Stop\n");
                  break;
                case 'e':
                  valid = true; //I think we want to change this
                  console.putmsg(green + high_intensity +
                        "Enter message\n\n");
		  if (userSettings.debug.message_posting) {
			console.putmsg(red + "Adding message via " +
			  "poast.addMsg() where base: " +
			  base.cfg.name + "\n");
		  }
		  bbs.sys_status ^= SS_MOFF;

		  try {
                    poast.addMsg(base, false, 'All');  //not an upload
		  } catch (e) {
		    console.putmsg(red + high_intensity + "Error " +
			"in poast.addMsg(): " + e.message + "\n");
		  }

		  bbs.sys_status ^= SS_MOFF;
                  break;
		case ' ':
		case 'n':
		  valid = true; hollaBack = 0;
		  docIface.log_str_n_char(this.log_header, 'n');
		  console.putmsg("\n");
		  break;
		case 'l':
		  docIface.util.quitDdoc();
		  break;
		case 'x':
		case 'X':
		  express.sendX();
		  break;
                default:
                  console.putmsg(normal + yellow + "Invalid choice\n");
                  break;
            }
          }

        return hollaBack;
        }
  },
  /*
   * summary:
   *	Sub-object for methods utilized when dropping through from the
   *	main-menuing system.  I think that these methods might also be
   *	utilized from rcChoice, also, which kind of puts my OO structure
   *	into question here...  Need to look at that at some point, or
   *	else place improper methods somewhere more appropriate.
   */
  entry_level : {
        /*
         * summary:
         *      Forward command to the appropriate methods for entry
         *      into the message reading routines in general
         * choice: char
         *      Code for the menu choice
         */
    handler : function(choice) {
	docIface.log_str_n_char(msg_base.log_header, choice);

        //which way do we go with this?
        switch (choice) {
          //purely message related functionality
          case 'n':     //read new
	    //NOTE: we'll need an enclosing loop to route through
	    //separate sub-boards now
	    console.putmsg(green + high_intensity + "Read new\n");
	    try {
		msg_base.scanSub(msg_area.sub[bbs.cursub_code], true);
	    } catch (e) {
		console.putmsg(yellow + "Exception reading new: " +
		      e.toString() + "\n");
	    }
            break;
	  case 'b':	// scan backwards
	    console.putmsg(green + high_intensity + "Read backward\n");
	    try {
	        msg_base.scanSub(msg_area.sub[bbs.cursub_code], false);
	    } catch (e) {
		console.putmsg(yellow + "Exception reading backwards: " +
		      e.toString() + "\n");
	    }
	    break;
          case 'k':     //list scanned bases
	    console.putmsg(green + high_intensity + "Known rooms list\n");
            this.listKnown();
            break;
          case 'e':     //enter a normal message
	    bbs.sys_status ^= SS_MOFF;
            poast.addMsg(docIface.nav.chk4Room(user.cursub), false, 'All');
	    bbs.sys_status ^= SS_MOFF;
            break;
          //other functionality tie-ins
          case 'w':     //normal wholist
            wholist.list_long();
            break;
          case 'W':     //short wholist
            wholist.list_short(wholist.populate());
            break;
          case 'x':     //express msg
	    bbs.sys_status ^= SS_MOFF;
            express.sendX();
	    bbs.sys_status ^= SS_MOFF;
            break;
	  case 'l':	//logout
	    docIface.util.quitDdoc();
	    break; 
          default:
            if (userSettings.debug.navigation) {
              console.putmsg("\nNot handled yet . . .\n\n");
	    }
            break;
        }
    },
        /*
         * summary:
         *      Lists all known message sub-boards (broken down by
         *      message base group, optionally)
         */
    listKnown : function() {
        console.putmsg("\n" + green + high_intensity);

        //we can fuck with multi-columns later
        if (!userSettings.confined) {
         for each (uMsgGrp in msg_area.grp_list) {
          if (userSettings.debug.navigation) {
                console.putmsg(uMsgGrp.description + "\n\n");
          }
          for each (uGrpSub in uMsgGrp.sub_list) {
                console.putmsg("\t" + uMsgGrp.name + ": " +
                  uGrpSub.description + "\n");
          }
         }
        } else {
         //uMsgGrp = msg_area.grp_list[topebaseno].sub_list
         for each (uGrpSub in msg_area.grp_list[topebaseno].sub_list) {
                console.putmsg("\t" + uGrpSub.description + "\n");
         }
        }
        console.putmsg("\n");
    }

  },
  //msg_base properties
  //these may not be determined dynamically (pretty sure), so this
  //will be a bug that needs to be fixed inline on a per-message read
  //basis
  menu : green + high_intensity + "\n\n<?> help\t\t" +
         "<a>gain\t\t<A>gain (no More prompt)\n<b>ack\t\t<D>" +
         "elete msg\t<e>nter msg\n<E>nter (upload)\t<h>elp\t\t\t" +
         "<i>nfo (forum)\n<n>ext\t\t<p>rofile author\t<s>top\n" +
         "<w>ho's online\t<x>press msg\t<X>press on/off\n\n",

  //--+++***===exceptions===***+++---

  //---+++***===msg_base methods follow===***+++---

  //should end up replacing most of newScan() [above] and some other
  //areas, I'm sure
	/*
	 * summary:
	 *	Displays message with or without pauses
	 * base: MsgBase object
	 *	Open message base object currently being read
	 * ptr: Integer
	 *	Current message index #
	 * breaks: Boolean
	 *	Default: true
	 *	true for screen pauses
	 */
  dispMsg : function(base, ptr, breaks) {
	var mHdr, mBody, fHdr;

	if (breaks != false) { 
	    breaks = true;
	}

        //try/catch this
        mHdr = base.get_msg_header(ptr);
        mBody = base.get_msg_body(ptr);

	if (userSettings.debug.message_scan) {
	    console.putmsg(red + "ptr: " + ptr + "\tbase.last_msg: "
		+ base.last_msg + "\n");
	}

	if (mHdr === null) {
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "Invalid message? base.cfg.code: "
		      + base.cfg.code + " ptr: " + ptr + "\n");
	    }
	    return;	// Invalid message, skip
	}

	fHdr = magenta + high_intensity + mHdr.date + green + " from "
	      + cyan + mHdr.from + "\n" + green;

	if (breaks) {
	    console.putmsg(fHdr + mBody, P_WORDWRAP);   // add fHdr into the
		// putmsg here so it gets included in the line count for breaks
        } else {
	    console.putmsg(fHdr + mBody, (P_NOPAUSE | P_WORDWRAP));
	}

	return 0;
  },
  /*
   * summary:
   *	Opens a new message base (modularizing)
   * mb:
   *	Code of the new message base to open
   * return:
   *	new message base object (already open), or 'null' for error
   */
  openNewMBase : function(mb) {
        try {  
	  //take care of this in calling code
          //mBase.close();
          mBase = new MsgBase(mb);
	  mBase.open();
          if (userSettings.debug.message_scan) {
            console.putmsg(red + "Opened: " + mb +
        	           " allegedly . . .\n");
          }
        } catch (e) {
          console.putmsg(red + "Error closing old mBase or " +
            "opening the new one after skip:\n" + e.toString() + "\n");
          log("Error skipping through scanSub(): " +
            e.toString());
          return null;
        }

	return mBase;
  },
	/*
	 * summary:
	 *	Sequentially scans for new messages within one
	 *	particular sub-board; don't forget to add the support
	 *	for whether confined or not after this is beta working
	 * sBoard: String
	 *	Sub-board's internal code
	 * forward: Boolean
	 *	true for forward read & converse
	 * return:
	 *	null/negative for errors; 1 to move on to the next sub, 
	 *	still working on further shite
	 */
  scanSub : function(sBoard, forward) {
	var tmpPtr, inc, choice;

	if (userSettings.debug.message_scan) {
	  console.putmsg("Entered scanSub(); forward = " + forward +
	    "  user.cursub: " + user.cursub + "\nsBoard.code: " +
	    sBoard.code + "\n");
	}

	mBase = this.openNewMBase(sBoard.code);

	if (mBase === null) {
	  if (userSettings.debug.message_scan) {
		console.putmsg("Error in openNewMBase()\n");
	  } 
	  throw new docIface.dDocException("scanSubException",
			"Error in openNewMBase()", 1);
	}

	tmpPtr = sBoard.scan_ptr;
	if (userSettings.debug.message_scan) {
	  console.putmsg("sBoard.scan_ptr = " + sBoard.scan_ptr + "\n");
	  console.putmsg("mBase.first_msg = " + mBase.first_msg + "\n");
	  console.putmsg("mBase.total_msgs = " + mBase.total_msgs + "\n");
	  console.putmsg("mBase.last_msg = " + mBase.last_msg + "\n");
	}
	
	if (forward) { inc = 1; } else { inc = -1; }
	
	// if starting in reverse from the room prompt, unskip one message
	if (!forward) tmpPtr += 1;  // so we start with the most recently read
	// message.  In all other cases we want to skip one.
	
	if (userSettings.debug.message_scan) {
	  console.putmsg("Inc: " + inc + "\tbased on forward\n");
	}

	//primary message scan loop
	while (true) {	// a bit shady, but we exit from within the switch/case
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "In main scanSub() loop\ttmpPtr: "
		      + tmpPtr + " total_msgs: " + mBase.total_msgs + "\n");
	    }

	    if ((tmpPtr <= 0) && (inc == -1)) {
		console.putmsg(red + "\nNo previous message\n");
		mBase.close();
		return 0;   // do we reverse scan from room to room also?
	    } else if ((tmpPtr >= mBase.total_msgs) && (inc == 1)) {
		console.putmsg(red + "\nEnd of messages\n");
		mBase.close();
		return 1;   // skip to next room
	    } else {
		tmpPtr += inc;
		if ((tmpPtr >= 0) && (tmpPtr <= mBase.total_msgs)) {
		    this.dispMsg(mBase, tmpPtr, true);
		    if (inc == 1) sBoard.scan_ptr = tmpPtr;
		}
	    }

	    console.putmsg(yellow + high_intensity + "\n["
		  + msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].name
		  + "> msg #" + (tmpPtr + 1)
		  + " (" + (mBase.total_msgs - tmpPtr) + " remaining)] "
		  + cyan + "Read cmd -> ");

	    try {
	      choice = this.read_cmd.rcChoice(mBase, tmpPtr);
	    } catch (e) {
		console.putmsg("Error passing mBase to rcChoice()\n" +
		  "Error: " + e.message + "\t\tmBase: " + mBase.name + "\n");
	    }

	    switch (choice) {
		case 2:		// Reverse scan direction
		    if (userSettings.debug.message_scan) {
			console.putmsg(red + "DEBUG: Reversing direction\n");
		    }
		    inc *= -1;
		    break;
		case 1:		// Stop scan
		    if (userSettings.debug.message_scan) {
			console.putmsg("DEBUG: Stopping scan\n");
		    }
		    mBase.close();
		    return null;
		case 0:		// No action
		    if (userSettings.debug.message_scan) {
			console.putmsg("DEBUG: Next Msg\n");
		    }
		    break;
		default:
		    console.putmsg(red + "\nUnexpected value from rcChoice: "
			  + choice + "\n");
		    return null;
	    }

	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "End of scanSub() main loop\n"
		      + "tmpPtr: " + tmpPtr + "\tinc: " + inc + "\n");
	    }

	}

	mBase.close();
	if (userSettings.debug.message_scan) {
	  console.putmsg(red + "Closed mBase: " + sBoard.code + "\n");
	}
    }
}
