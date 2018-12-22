function TagText(tagname){
    var r = window.getSelection().getRangeAt(0);

    if(tagname.localeCompare("UnTag")===0){
        // check the user select the valid tag area
        let node = $(r.commonAncestorContainer);
        let parentTagName = node.parent()[0].tagName;
        console.log(parentTagName);
        let regex = new RegExp('DIV|doc_content|section','i');
        console.log(parentTagName.search(regex));
        if (parentTagName.search(regex) === 0) {
            alert("You select invalid tag area (be careful about space character)");
            return;
        }
        node.unwrap();
    }
    else {
        if (r.startContainer.parentNode.textContent !== r.endContainer.parentNode.textContent) {
            alert("You select invalid tag area (be careful about space character)");
            return;
        }
        var newObj;
        if (!confirm("Are you sure to add \"" + tagname + "\" on the \"" + r.cloneContents().textContent + "\"?")) {
            return;
        } else {
            let s = r.extractContents();
            if (tagname.toUpperCase().startsWith("UDEF_")) {
                // newObj = $.parseXML(`<${tagname} class="Udef">${s.textContent}</${tagname}>`);
                let div = document.createElement('div');
                div.appendChild( s.cloneNode(true) );
                let html = div.innerHTML;
                newObj = $.parseXML(`<${tagname} class="Udef">${html}</${tagname}>`);

            }
            else {
                let userinput = false;
                if (confirm("Do you need to add to RefId From CBDB, TWGIZ or TGAZ?")) {
                    userinput = prompt("Please input RefId: ");
                }
                let div = document.createElement('div');
                div.appendChild( s.cloneNode(true) );
                let html = div.innerHTML;
                if (userinput) {
                    newObj = $.parseXML(`<${tagname} RefId="${userinput}" Term="${userinput}" >${html}</${tagname}>`);
                }
                else {
                    newObj = $.parseXML(`<${tagname}>${html}</${tagname}>`);
                }

            }
        }

        r.insertNode(newObj.documentElement);
    }

    // change the textarea orginal tags
    let curDoc = $("#doc_"+currentDoc+" doc_content");
    $("#DocContext").html(curDoc.html());
    curDoc.html(curDoc.html());
    ModifyDocContent();

}

function AddSpecificTerm(){
    for (var xmlFilename in MyXmlList) {
        var docsInfo = MyXmlList[xmlFilename].docsInfo;
        var jqXmlDoc = $.parseXML(MyXmlList[xmlFilename].text);
        var TP = $(jqXmlDoc).find("ThdlPrototypeExport > corpus ");
        var FA = $(jqXmlDoc).find("ThdlPrototypeExport > corpus > feature_analysis ");
        //var newObj = $("<"+tagname+">").append(s.textContent);
        // var NewID = $("#SpecificTermID").val();
        var NewID = $("#xmlFeatureAnalysisTagTitle > tbody > tr").length;
        var NewTag = "Udef_"+ $("#SpecificTermTag").val();
        var NewTitle = NewTag + "/-";

        if (FA.length > 0) {
            let temp = FA.html() + '<tag type="contentTagging" name="' + NewTag + '" default_category="' + NewTag + '" default_sub_category="-"/>';
            TP.find("feature_analysis").html(temp);

        } else {
            var Thdl = $(jqXmlDoc).find("ThdlPrototypeExport");
            var temp = '<corpus name="*"><feature_analysis>' +
                '<tag type="contentTagging" name="' + NewTag + '" default_category="' + NewTag + '" default_sub_category="-"/></feature_analysis></corpus>' + Thdl.html();
            Thdl.html(temp);
        }

        //console.log(MyXmlList[xmlFilename]);

        //$(jqXmlDoc).find("ThdlPrototypeExport > documents > document").text(temp.html());
        MyXmlList[xmlFilename] = {text: new XMLSerializer().serializeToString(jqXmlDoc), docsInfo: docsInfo};

        //var s = replaceXmlData(MyXmlList[xmlFilename]);    // 會用到頁面上的資訊來進行取代，因此不能先把頁面資訊清除...
        resetXmlMetadataInfo();                            // 計算後才能清除頁面資訊
        parseXmlStr(MyXmlList[xmlFilename].text, xmlFilename);
    }
    // clean input text
    $('#SpecificTermTag').val("");

    // reset select AdvanceTag
    $("#openAdvanceTagging").click().click();

}

function AddAdvanceTag(){
    let AdvanceTagTerm  = $("#AdvanceTagTerm").val();
    let $selectedTag = $( "#AdvanceTag option:selected" );
    let AdvanceTag  = $selectedTag.text();
    let AdvanceTagRefId  = $("#AdvanceTagRefId").val();
    // check the input is valid
    let check = true;
    if (AdvanceTagRefId.length !== 0) {
        // check the CBDB id is correct
        if ($selectedTag.text()==="PersonName") {
            let regex = RegExp("^cbdb_*");
            if (AdvanceTagRefId.search(regex) !== 0) {
                alert("RefId is error for CBDB. It need be cbdb_XXX...");
                check = false;
            }
        } else if ($selectedTag.text()==="LocName") {
            let regex = RegExp("^twgis_*|^hvd_*");
            if (AdvanceTagRefId.search(regex) !== 0) {
                alert("RefId is error for TWGIS or TGAZ. It need be twgis_XXX... or hvd_XXX...");
                check = false;
            }
        }
    }
    if (check && confirm("Are you sure change all \""+AdvanceTagTerm+"\" terms tag with "+AdvanceTag+".")) {
        console.log("advancetag: " + AdvanceTag);
        let UdefArra =["LocName", "PersonName"];
        $("#xmlFeatureAnalysisTagTitle").find("tr").each(
            function(index){
                if(index==0){
                    return;
                }
                UdefArra.push($(this).find("td").eq(1).text().trim());
            }
        );
        for (var xmlFilename in MyXmlList) {
            let docsInfo = MyXmlList[xmlFilename].docsInfo;
            let jqXmlDoc = $.parseXML(MyXmlList[xmlFilename].text);
            let temp = $(jqXmlDoc).find("ThdlPrototypeExport > documents ");

            temp.find("document").each(function( index ) {
                let BeforeModify = $(this).find("doc_content").html();

                if(AdvanceTagRefId){
                    // BeforeModify = BeforeModify.replace(new RegExp("<\\s*\\w.[^>]*?>"+AdvanceTagTerm+"<\\s*\\/\\s*\\w\\s*.*?>|"+AdvanceTagTerm,"ig"),`<${AdvanceTag} RefID="${AdvanceTagRefId}" Term="${AdvanceTagRefId}">${AdvanceTagTerm}</${AdvanceTag}>`);
                    BeforeModify = BeforeModify.replace(new RegExp(AdvanceTagTerm,"ig"),`<${AdvanceTag} RefID="${AdvanceTagRefId}" Term="${AdvanceTagRefId}">${AdvanceTagTerm}</${AdvanceTag}>`);
                } else {
                    // BeforeModify = BeforeModify.replace(new RegExp("<\\s*\\w.[^>]*?>"+AdvanceTagTerm+"<\\s*\\/\\s*\\w\\s*.*?>|"+AdvanceTagTerm,"ig"),`<${AdvanceTag}>${AdvanceTagTerm}</${AdvanceTag}>`);
                    BeforeModify = BeforeModify.replace(new RegExp(AdvanceTagTerm,"ig"),`<${AdvanceTag}>${AdvanceTagTerm}</${AdvanceTag}>`);
                }
                $(this).find("doc_content").html(BeforeModify);

                // add tag into <doc_user_tags>
                let tags = [], tagsXml = "";
                $(this).find("doc_content").find("*").filter(function(){
                    return /^Udef_/i.test($(this).prop("tagName"));
                }).each(function () {
                    if (tags.indexOf($(this).prop("tagName")) === -1) {
                        tags.push($(this).prop("tagName"));
                        tagsXml += "<tag name=\""+$(this).prop("tagName")+"\" type=\"contentTagging\" default_category=\""+$(this).prop("tagName")+"\" default_sub_category=\"-\"/>"
                    }
                });
                temp.find("doc_user_tagging").eq(currentDoc).html(tagsXml);
            });




            MyXmlList[xmlFilename] = { text:  new XMLSerializer().serializeToString(jqXmlDoc) , docsInfo: docsInfo };
            resetXmlMetadataInfo();
            parseXmlStr(MyXmlList[xmlFilename].text, xmlFilename);
        }

        // reset initial status
        resetAddAdvanceTag();
    }
}

// if selected tags is person name or location name, show RefId text input
$("#AdvanceTag").change(function () {
    let selectedOption = $( "#AdvanceTag option:selected" );
    if (
        selectedOption.text()==="LocName" ||
        selectedOption.text()==="PersonName"
    ) {

        $('#isAddRefId').css("display", "block");
    }
});


// reset select AdvanceTag
$("#openAdvanceTagging").click(function() {
    $('#2-2AdvanceTagging').toggle(function() {
        // add option of tags into the AdvanceTag when #AddSpecificTerm click
        let UdefArra =[" -- select an option -- ", "LocName", "PersonName"];
        $("#xmlFeatureAnalysisTagTitle").find("tr").each(
            function(index){
                if(index==0){
                    return;
                }
                UdefArra.push($(this).find("td").eq(1).text().trim());
            }
        );
        $("#AdvanceTag").html(UdefArra.map( (ii)=>(`<option>${ii}</option>`) ).join(""));
    });
});

// if user want to input CBDB、TWGIS refid, show the area
$('#isAddRefId input[type="checkbox"]').change(function() {
    if($(this).is(":checked")) {
        $('#AdvanceTagRefIdArea').css("display", "block");
    } else {
        $('#AdvanceTagRefIdArea').css("display", "none");
    }
});

// reset 2-2AddAdvanceTag option
function resetAddAdvanceTag() {
    let $AdvanceTagTerm  = $("#AdvanceTagTerm");
    let $AdvanceTag = $("#AdvanceTag");
    let $isAddRefId = $("#isAddRefId");
    let $AdvanceTagRefId  = $("#AdvanceTagRefId");

    $AdvanceTagTerm.val(""); // clear $AdvanceTagTerm value
    $AdvanceTag.prop('selectedIndex',0); // reset option to initial status
    $isAddRefId.hide();
    $isAddRefId.find('input[type="checkbox"]').prop('checked', false);
    $AdvanceTagRefId.val("");

    // reset current document to doc_0
    JumpSpecificDoc(0);
}