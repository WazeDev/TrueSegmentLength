// ==UserScript==
// @name         WME True Segment Length
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2024.06.21.01
// @description  Displays geodesic segment length in feet & meters
// @author       JustinS83
// @include      https://www.waze.com/editor*
// @include      https://www.waze.com/*/editor*
// @include      https://beta.waze.com/*
// @exclude      https://www.waze.com/user/editor*
// @grant        none
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @license      GPLv3
// ==/UserScript==

/* global W */
/* global OL */
/* ecmaVersion 2017 */
/* global $ */
/* global _ */
/* global WazeWrap */
/* eslint curly: ["warn", "multi-or-nest"] */

(function() {

    function bootstrap(tries=1) {

        if (W &&
            W.map &&
            W.model &&
            $ && WazeWrap.Ready)
            init();
        else if (tries < 1000)
            setTimeout(function () {bootstrap(++tries);}, 200);
    }

    bootstrap();

    function init(){
        W.selectionManager.events.register("selectionchanged", null, waitAndUpdate);
        W.model.actionManager.events.register("afteraction",null, updateDisplay);
        W.model.actionManager.events.register("afterundoaction",null, updateDisplay);
        W.model.actionManager.events.register("afterclearactions",null, updateDisplay);
        W.model.actionManager.events.register("noActions",null, waitAndUpdate);
        console.log("WME True Segment Length" + GM_info.script.version);
    }

    async function waitAndUpdate(){
        await new Promise(r => setTimeout(r, 150));
        updateDisplay();
    }

    function updateDisplay(){
        var count = WazeWrap.getSelectedDataModelObjects().length;
        var metersLength = 0;
        var bold = false;

        if(count > 0){
            for(let i=0;i<count;i++){
                let seg = WazeWrap.getSelectedDataModelObjects()[i];
                if(seg.type === "segment"){
                    metersLength += WazeWrap.Geometry.calculateDistance(seg.getOLGeometry().components);
                    if(!seg.isUnchanged())
                        bold = true;
                }
            }
            if(metersLength >0){
                var isUSA = (typeof W.model.countries.objects[235] !== 'undefined');
                var ftLength = Math.round(metersLength * 3.28084 *100)/100;
                var milesLength = Math.round(ftLength/5280 *1000)/1000;

                if(WazeWrap.getSelectedDataModelObjects()[0].attributes.id < 0){ //segment has not yet been saved
                    var list = $('#segment-edit-general > div > ul')[0];
                    var newItem = document.createElement("LI");
                    var textnode = document.createTextNode("Length: " + metersLength +" m");
                    newItem.appendChild(textnode);
                    list.insertBefore(newItem, list.childNodes[0]);

                    if(isUSA){
                        newItem = document.createElement("LI");
                        textnode = document.createTextNode(`Length: ${ftLength} ft (${milesLength} miles)`);
                        newItem.appendChild(textnode);
                        list.insertBefore(newItem, list.childNodes[0]);
                    }
                }
                else{
                    try
                    {
                        $('#segment-edit-general > div > ul > li:nth-child(1) > span')[1].innerHTML = (Math.round(metersLength*100)/100) + " m";
                        if($('#segment-edit-general > div > ul > li:nth-child(1) > span').length === 2 && isUSA)
                            $('#segment-edit-general > div > ul > li:nth-child(1)').append(`<br/><span class="name">Length: </span><span class="value">${ftLength} ft</span><span class="value"> (${milesLength} miles)</span>`);
                        if(bold){
                            $('#segment-edit-general > div > ul > li:nth-child(1) > span').css('font-weight', "bold");
                            if(isUSA)
                                $('#segment-edit-general > div > ul > li:nth-child(2) > span').css('font-weight', "bold");
                        }
                    }
                    catch(ex)
                    {

                    }
                }
            }
        }
    }

})();
