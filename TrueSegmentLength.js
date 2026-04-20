// ==UserScript==
// @name         WME True Segment Length
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2026.04.20.01
// @description  Displays geodesic segment length in feet & meters
// @author       JustinS83
// @include      https://www.waze.com/editor*
// @include      https://www.waze.com/*/editor*
// @include      https://beta.waze.com/*
// @exclude      https://www.waze.com/user/editor*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js
// @license      GPLv3
// @downloadURL https://update.greasyfork.org/scripts/25444/WME%20True%20Segment%20Length.user.js
// @updateURL https://update.greasyfork.org/scripts/25444/WME%20True%20Segment%20Length.meta.js
// ==/UserScript==

/* global W */
/* global OL */
/* ecmaVersion 2017 */
/* global $ */
/* global _ */
/* eslint curly: ["warn", "multi-or-nest"] */

(function() {

    let sdk;
    const ObjectTypes = Object.freeze({
        SEGMENT: 'segment',
        PLACE: 'venue'});

    async function bootstrap() {
        await window.SDK_INITIALIZED;
        sdk = getWmeSdk({ scriptId: 'wme-tsl', scriptName: 'WME True Segment Length' });
        await sdk.Events.once({ eventName: 'wme-ready' });

        init();
    }

    bootstrap();

    function init(){
        sdk.Events.on({ eventName: 'wme-selection-changed', eventHandler: waitAndUpdate });
        sdk.Events.on({ eventName: 'wme-after-edit', eventHandler: waitAndUpdate });
        sdk.Events.on({ eventName: 'wme-after-undo', eventHandler: waitAndUpdate });
        sdk.Events.on({ eventName: 'wme-after-redo-clear', eventHandler: waitAndUpdate });
        sdk.Events.on({ eventName: 'wme-no-edits', eventHandler: waitAndUpdate });
        console.log("WME True Segment Length" + GM_info.script.version);
    }

    async function waitAndUpdate(){
        await new Promise(r => setTimeout(r, 150));
        updateDisplay();
    }

    function updateDisplay(){
        debugger;
        let selection = sdk.Editing.getSelection();
        if(selection && selection?.ids.length > 0 && selection.objectType == ObjectTypes.SEGMENT){
            var count = selection.ids.length;
            var bold = false;

            const metersLength = selection.ids.reduce((total, id) => {
                const seg = sdk.DataModel.Segments.getById({segmentId: id});
                if(!seg) return total;
                return total + turf.length(seg.geometry, {units:'meters'});
            }, 0);

            if(metersLength >0){
                var isUSA = sdk.Settings.getRegionCode() === 'usa';
                var ftLength = Math.round(metersLength * 3.28084 *100)/100;
                var milesLength = Math.round(ftLength/5280 *1000)/1000;

                if(selection.ids[0] < 0){ //segment has not yet been saved
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
