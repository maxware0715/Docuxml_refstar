const UNCHANGE_STR = '(保持不變)';
const DELETE_STR = '(刪除此標籤)';
var docuSkyObj = null;
var MyXmlList = {};
var fileDocuments;
var currentDoc = 0;
// MyXmlList[xmlFilename] = { text(string), docsInfo(object) }
var ThdlMetadataFields = { 'corpus'             : { pcTitle: '-', description: '文獻集名稱' },
    'compilation'        : { pcTitle: 'COMP', description: '文件出處' },
    'compilation_name'   : { pcTitle: 'COMP', description: '文件出處（另有冊數時使用）' },
    'compilation_vol'    : { pcTitle: '-', description: '文件出處第幾冊（整數）' },
    //'compilation_order': { pcTitle: '-', description: '文件出處的排列順序（欄位值必須為整數）'},
    'title'              : { pcTitle: '-', description: '文件標題' },
    'author'             : { pcTitle: 'AU', description: '文件作者' },
    'topic'              : { pcTitle: 'TP', description: '文件主題' },
    'geo'                : { pcTitle: 'GEO', description: '文件地域' },
    'geo_longitude'      : { pcTitle: '-', description: '文件經度 (-180.00~180.00)' },
    'geo_latitude'       : { pcTitle: '-', description: '文件緯度 (-90.00~90.00)' },
    'docclass'           : { pcTitle: 'CLASS', description: '文件類別' },
    'docclass_aux'       : { pcTitle: '-', description: '文件子類別' },
    'doc_category_l1'    : { pcTitle: 'CAT1', description: '文件分類（最上層分類）' },
    'doc_category_l2'    : { pcTitle: 'CAT2', description: '文件分類（第二層分類）' },
    'doc_category_l3'    : { pcTitle: 'CAT3', description: '文件分類（最三層分類）' },
    'cue_category'       : { pcTitle: 'CAT', description: '文件分類 (doc_category_l1/doc_category_l2/doc_category_l3)'},
    'doctype'            : { pcTitle: 'TYPE', description: '文件型態' },
    'doctype_aux'        : { pcTitle: '-', description: '文件子型態' },
    'doc_genre'          : { pcTitle: 'GENRE', description: '文件類型' },
    'book_code'          : { pcTitle: 'BC', description: '文件書碼' },
    'time_orig_str'      : { pcTitle: '-', description: '文件的時間資訊（字串）' },
    'time_varchar'       : { pcTitle: 'AD_YMD', description: '文件時間的西元日期（yyyymmdd）' },
    'time_norm_year'     : { pcTitle: '-', description: '文件時間的中曆年' },
    'era'                : { pcTitle: 'ERA', description: '文件時間的帝號' },
    //'era_order'        : { pcTitle: '-', description: '文件時間的帝號順序' },
    'time_norm_kmark'    : { pcTitle: '-', description: '文件時間的年號' },
    'year_for_grouping'  : { pcTitle: 'ADY', description: '文件時間的西元年份（常用於後分類）' },
    'time_dynasty'       : { pcTitle: 'DYN', description: '文件時間的朝代' },
    'timeseq_not_before' : { pcTitle: 'TNB', description: '文件「在某日期之後」的時間(可為 yyyymmdd 或任一整數)' },
    'timeseq_not_after'  : { pcTitle: 'TNA', description: '文件「在某日期之前」的時間(可為 yyyymmdd 或任一整數)' },
    'timeseq_number'     : { pcTitle: '-', description: '文件的時間(可為 yyyymmdd 或任一整數)' },
    //'doc_seq_number'   : { pcTitle: '-', description: '文件的顯示順序（必須為整數 -- 尚未實作）' },
    'doc_code'           : { pcTitle: '-', description: '文件的編碼（例如索書號或任意編碼）' },
    'doc_source'         : { pcTitle: 'SRC', description: '文件的來源' }
};


// valid XML 1.0 characters: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
// XML 1.1: Char ::= [#x1-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF] /* any Unicode character, excluding the surrogate blocks, FFFE, and FFFF. */
//          RestrictedChar ::= [#x1-#x8] | [#xB-#xC] | [#xE-#x1F] | [#x7F-#x84] | [#x86-#x9F]
// Characters need to be escaped: <&>'"
// var object = $.extend({}, object1, object2);
// $('<div>').append(xmlObj).html()

function htmlAttrEscapeJsonStr(s) {
    return s.replace(/\"/g, "&#x22;").replace(/\'/g, "&#x27;");
}

function htmlAttrUnescapeJsonStr(s) {
    return s.replace(/&#x22;/g, '"').replace(/&#x27;/g, "'");
}

function htmlEncode(value) {
    // create a in-memory div, set it's inner text, and then grab the encoded contents back out.
    // this div never exists on the page.
    return $('<div/>').text(value).html();
}

function htmlDecode(value) {
    return $('<div/>').html(value).text();
}

$(document).ready(function() {
    // register actions
    $("#inputNewCorpus").click(function() {
        if ($("#inputNewCorpus").prop("checked")) $("#spanNewCorpus").show();
        else {
            $("#newCorpusVal").val("");
            $("#spanNewCorpus").hide();
        }
    });

    $("#2-2AdvanceTagging").hide();
    //docuSky upload API
    docuSkyObj = docuskyManageDbListSimpleUI;
    $("#manageDbList").click(function(e) {
        docuSkyObj.manageDbList(e);
    });

});

function resetXmlMetadataInfo() {
    $("#loadedFileBrief").html("");
    $("#newCorpusVal").val("");
    $("#inputNewCorpus").prop("checked", false);
    $("#xmlMetadataFields").find("tr:gt(0)").remove();             // remove all <tr> except the first
    $("#xmlMetadataTagTitle").find("tr:gt(0)").remove();           // remove all <tr> except the first
    $("#xmlFeatureAnalysisTagTitle").find("tr:gt(0)").remove();    // remove all <tr> except the first
}

function PreDoc(){
    JumpSpecificDoc(--currentDoc);
}

function saveAndNextDoc(){
    let $eachdocument = $('#eachdocument');
    //save
    let docsInfo ="";
    for (var xmlFilename in MyXmlList){
        docsInfo = MyXmlList[xmlFilename].docsInfo;
        let jqXmlDoc = $.parseXML(MyXmlList[xmlFilename].text);
        let temp = $(jqXmlDoc).find("ThdlPrototypeExport > documents ");
        let doc = $("#doc_"+currentDoc).find("document");
        let regex = /<br\s*[\/]?>/gi;
        let afterreg = doc[0].outerHTML.replace(regex, "<br/>");
        let tags = [], tagsXml = "";

        doc.find("*").filter(function(){
            return /^Udef_/i.test($(this).prop("tagName"));
        }).each(function () {
            if (tags.indexOf($(this).prop("tagName")) === -1) {
                tags.push($(this).prop("tagName"));
                tagsXml += "<tag name=\""+$(this).prop("tagName")+"\" type=\"contentTagging\" default_category=\""+$(this).prop("tagName")+"\" default_sub_category=\"-\"/>"
            }
        });

        temp.find("document").eq(currentDoc).replaceWith($.parseXML(afterreg).documentElement);
        temp.find("doc_user_tagging").eq(currentDoc).html(tagsXml);

        MyXmlList[xmlFilename] = { text:  new XMLSerializer().serializeToString(jqXmlDoc) , docsInfo: docsInfo };
    }
    JumpSpecificDoc(++currentDoc);
}
function JumpSpecificDoc(page){

    let $eachdocment = $('#eachdocument');

    $eachdocment.children().hide();

    if(page!=null){
        currentDoc = page;
    } else {
        currentDoc = $("#NumJumpSpecificDoc").val()*1;
    }

    if(0>currentDoc){
        currentDoc=0;
    } else if (currentDoc>fileDocuments-1){
        currentDoc = fileDocuments-1;
    }

    let $curDoc = $("#doc_"+currentDoc);
    // $curDoc.html().replace(/<udefforcolor>/g,"").replace(/<\/udefforcolor>/g,"");
    // let afterreg = $curDoc.html().replace(/<udef_.*?>/g,(ii)=>("<udefforcolor>"+ii) )
    //     .replace(/<\/udef_.*?>/g, (ii)=>(ii+"</udefforcolor>"));
    // $curDoc.html($.parseXML(afterreg).documentElement);
    $curDoc.show();

    ShowMetaData();

    $('html,body').animate({
        scrollTop: $(".contentArea:eq(2)").offset().top
    }, 'slow');

}
function TagPopup(){
    var r = window.getSelection().getRangeAt(0);
    if(!r.toString()){
        $("#PopupBox").hide();
    }else{
        let UdefArra =[];
        $("#xmlFeatureAnalysisTagTitle").find("tr").each(
            function(index){
                if(index==0){
                    return;
                }
                UdefArra.push($(this).find("td").eq(1).text().trim());
            }
        );
        $("#InnerPopupBox").html(UdefArra.map( (ii)=>(`<button onclick="TagText(this.innerHTML);">${ii}</button>`) ).join(""));
        $("#PopupBox").show();

    }

}



function AddMetaData(){
    for (var xmlFilename in MyXmlList) {
        var docsInfo = MyXmlList[xmlFilename].docsInfo;
        var jqXmlDoc = $.parseXML(MyXmlList[xmlFilename].text);
        var jqUserXmlMetadata = $(jqXmlDoc).find("ThdlPrototypeExport > documents > document > xml_metadata");
        var NewMetaDataName = $("#NewMetaDataName").val();
        var NewMetaDataValue= $("#NewMetaDataValue").val();
        jqUserXmlMetadata.each(function(){
            $(this).append(`<${NewMetaDataName}>${NewMetaDataValue}</${NewMetaDataName}>`);

        });

        MyXmlList[xmlFilename] = { text:  new XMLSerializer().serializeToString(jqXmlDoc) , docsInfo: docsInfo };

        resetXmlMetadataInfo();                            // 計算後才能清除頁面資訊
        parseXmlStr(MyXmlList[xmlFilename].text, xmlFilename);
    }
}
function ShowDocContent(){
    let curDoc = $("#doc_"+currentDoc);
    $("#DocContext").html(curDoc.find('doc_content').html());

}

function ShowMetaData(){
    let $eachdocment = $('#eachdocument');
    // clean head
    $eachdocment.find('h3').remove();
    $('<h3>Document Content('+ (currentDoc+1) + '-' + fileDocuments +')</h3>').insertBefore($eachdocment.find('doc_content'));

    ShowDocContent();

    let $curDoc = $("#doc_"+currentDoc);
    var tabledata='<table class="fileInfo" id="ShowDocMetaDataTable">' +
        '<tr>' +
        '<th class="fileInfo">MetaData欄位</th>' +
        '<th class="fileInfo">Value</th>' +
        '</tr>';
    var doc = $curDoc.find("document > *");
    doc.each(function(){
        if(this.nodeName==="DOC_CONTENT" || this.nodeName==="XML_METADATA" || this.nodeName==="doc_content" || this.nodeName==="xml_metadata" ){
        } else {
            tabledata = tabledata + `<tr class="fileInfo" align="center"><td class="fileInfo" >${this.nodeName}</td><td class="fileInfo"><input type="text" value="${this.textContent}" size="40"></input></td><tr>`;
        }
    });

    var docinXML_METADATA = $curDoc.find("document > xml_metadata > *");
    docinXML_METADATA.each( function() {
        if (this.nodeName==="DOCMETADATA") {
        } else {
            tabledata = tabledata + `<tr class="fileInfo" align="center"><td class="fileInfo">${this.nodeName}</td><td class="fileInfo"><input type="text" value="${this.textContent}" size="40"></input></td><tr>`;
        }
    });
    var docinDOCMETADATA = $curDoc.find("document > xml_metadata > docmetadata > *");
    docinDOCMETADATA.each(function(){
        tabledata = tabledata + `<tr class="fileInfo" align="center"><td class="fileInfo">${this.nodeName}</td><td class="fileInfo"><input type="text" value="${this.textContent}" size="40"></input></td><tr>`;
    });

    tabledata = tabledata +'</table>' + '<button onclick="ModifyMetaData()">點我儲存&下一個</button>';
    let $ShowDocMetaData = $("#ShowDocMetaData");
    $ShowDocMetaData.html(tabledata);
    // $ShowDocMetaData.hide();
    ShowDanXinPic();

}

function ShowDanXinPic(){
    $("#ShowDocMetaDataTable tr").each(function(iii){
        if(iii%2 === 0){
            return 0;
        }
        var currentRow=$(this);
        var col1_value=currentRow.find("td:eq(0)").text().trim();

        if(col1_value==="filename" || col1_value==="FILENAME"){
            let col2_value=$(currentRow.find("td:eq(1)").find("input")).val();
            let outputlink = `<a href="http://thdl.ntu.edu.tw/THDL/RetrieveImage.php?image_group=DanXinFiles-jpg&image_fname=${col2_value}.jpg"
								target="_blank">淡新圖檔</a><b style="color: gray;">(請先登錄THDL，否則會出現空白頁面)</b>`;
            $("#DanXinPic").html(outputlink);
        }
    });
}
function ModifyDocContent(){
    let curDoc = $("#doc_"+currentDoc+" doc_content");
    let textareaContext = $("#DocContext");

    if (textareaContext.text().localeCompare(curDoc.text()) !== 0) { // if user change the content
        if (confirm("您確定要修改原文內容？")){
            curDoc.html(textareaContext.html()); // change the doc_content

            // change the xml
            let docsInfo ="";
            for (var xmlFilename in MyXmlList){
                docsInfo = MyXmlList[xmlFilename].docsInfo;
                let jqXmlDoc = $.parseXML(MyXmlList[xmlFilename].text);
                let temp = $(jqXmlDoc).find("ThdlPrototypeExport > documents ");
                let doc = $("#doc_"+currentDoc).find("document");
                let regex = /<br\s*[\/]?>/gi;
                let afterreg = doc[0].outerHTML.replace(regex, "<br/>");
                temp.find("document").eq(currentDoc).replaceWith($.parseXML(afterreg).documentElement);
                MyXmlList[xmlFilename] = { text:  new XMLSerializer().serializeToString(jqXmlDoc) , docsInfo: docsInfo };
            }
        }
    }

}
function ModifyMetaData(){
    //var currentRow=$("#ShowDocMetaDataTable").closest("tr");
    //var cellvalue = currentRow.find("td");
    var temp = $("#doc_"+currentDoc);
    $("#ShowDocMetaDataTable tr").each(function(iii){
        if(iii%2===0){
            return 0;
        }
        var currentRow=$(this);
        var col1_value=currentRow.find("td:eq(0)").text().trim();
        //console.log(col1_value);
        if(col1_value==="doc_content" || col1_value==="xml_metadata" || col1_value==="DOC_CONTENT" || col1_value==="XML_METADATA"){
            return 0;

        }
        var col2_value=$(currentRow.find("td:eq(1)").find("input")).val();
        col2_value = col2_value.trim().toLowerCase();
        col1_value = col1_value.toLowerCase();
        if(col1_value){
            temp.find(col1_value).text(col2_value);
        }

    });

    saveAndNextDoc();
}

function SearchOutside(searchgoal){
    if(searchgoal==="CBDB"){
        window.open('https://cbdb.fas.harvard.edu/cbdbapi/person.php?name='+window.getSelection().toString());

    }
    if(searchgoal==="TWGIS"){
        window.open('http://docusky.digital.ntu.edu.tw/DocuSky/docutools/geocode/map.html?n='+window.getSelection().toString());

    }
    if(searchgoal==="TGAZ"){
        window.open('https://maps.cga.harvard.edu/tgaz/placename?n='+window.getSelection().toString());

    }


}

function getXmlDocsInfo(xmlFilename, xml) {
    // parse XML file and traverse it to get all required information
    var jqXmlDoc = $.parseXML(xml);            // returns XMLDocument
    var jqXml = $(jqXmlDoc);                   // returns jQuery object

    // 檔案中的文件數量
    var myDictionary = {};
    var jqDocumentNodes = jqXml.find("ThdlPrototypeExport > documents > document");
    fileDocuments = jqDocumentNodes.length;
    // (This doesn't work- returns tagless, unformatted text)

    let $eachdocument = $("#eachdocument");
    $eachdocument.empty();
    /*var jqDD = jqDocumentNodes.find("*");
    alert(qDD.length);
    jqDD.each(function(index){

      if(this.nodeName.startsWith("UDEF_")){
        $(this).css("color", "yellow");
        console.log(index,jqDD.length);
      }
    });*/
    for(var i=0;i<fileDocuments;i++){

        var xmlstr = (new XMLSerializer()).serializeToString(jqDocumentNodes[i]);
        var str4div = "<div id="+"\"doc_"+i+"\""+" class=\"showDoc \">";
        // check the xmlstr have close form tag like <XXX/>, and then change it to <XXX></XXX>

        const regex = RegExp("<([^>]+)/>","gm");
        const subst = `<$1></$1>`;
        xmlstr = xmlstr.replace(regex, subst);

        $('#eachdocument').append(str4div+xmlstr+"</div>");
        $("#doc_"+i).hide().find("*").filter(function(){
            return /^Udef_/i.test(this.nodeName);
        }).attr('class', 'Udef');

        // add Udef_ class to all tag start with Udef_
    }

    // initilize the first document presentation
    let $doc_0 = $("#doc_0");
    $doc_0.show();
    // $('<h3>Document Content(1-'+ fileDocuments +')</h3>').insertBefore($eachdocument.find('doc_content'));


    var jqdc = $doc_0.find("doc_content").find("*");
    jqdc.each(function(index){

        if(this.nodeName.startsWith("UDEF_")){
            // $(this).css({
            //     'background-color': '#4F6F4F',
            //     'color': '#EFEFEF',
            //     'padding': '2px',
            //     'border-radius':'4px',
            //     'line-height': '200%',
            // });
            //console.log(index,jqDD.length);
        }
    });
    ShowMetaData();
    $('#ShowDocMetaData').hide();

    //alert(fileDocuments);

    // 文件中所包含的 metadata 欄位
    var myDictionary = {};
    $(jqDocumentNodes).each(function() {
        var jqMetadataNodes = $(this).children();
        $(jqMetadataNodes).each(function() {
            //alert(this.tagName);
            var key = this.tagName;
            // 2018-02-25: 加上 cue_category 的特殊處理...
            if (key == 'doc_category_l1' || key == 'doc_category_l2' || key == 'doc_category_l3') {
                myDictionary['cue_category'] = 1;
            }
            if (typeof myDictionary[key] === "undefined") myDictionary[key] = 1;
            else myDictionary[key]++;

        });
    });

    var metadataFields = [];
    for (var key in myDictionary) metadataFields.push(key);

    // 2017-05-30: 使用者自訂的 metadata 欄位（必須對每篇文件的 <xml_metadata> 下的標籤取聯集來獲得）
    var userMetadataDictionary = [];
    var jqUserXmlMetadata = jqXml.find("ThdlPrototypeExport > documents > document > xml_metadata > *");
    $(jqUserXmlMetadata).each(function() {
        if (userMetadataDictionary.indexOf(this.tagName) === -1) userMetadataDictionary.push(this.tagName);
    });
    //alert(JSON.stringify(userMetadataDictionary));

    //// 資料庫參考資料
    //var myDbRefdataList = {};
    //var jqDbRefdataNodes = jqXml.find("ThdlPrototypeExport > database > refdata");
    //for (var i=0; i<jqDbRefdataNodes.length; i++) {
    //   var refdataName = $(jqDbRefdataNodes[i]).attr("name");
    //   myDbRefdataList[refdataName] = 1;
    //}
    //
    //// 文獻集參數設定 (e.g., metadata_field_settings)
    //var myCorpusSettingList = {};
    //var jqCorpusSettingNodes = jqXml.find("ThdlPrototypeExport > corpus");
    //for (var i=0; i<jqCorpusSettingNodes.length; i++) {
    //   var corpusName = $(jqCorpusSettingNodes[i]).attr("name");
    //   myCorpusSettingList[corpusName] = 1;
    //}

    // 2017-05-30: 文獻集 metadata_field_settings （原先取名 xml_tag_title 並不合適）
    var myMetadataFieldSettingsDictionary = {};
    var jqMetadataFieldNodes = jqXml.find("ThdlPrototypeExport > corpus > metadata_field_settings");
    if (jqMetadataFieldNodes.length > 0) {
        var jqMetadataFieldNode = jqMetadataFieldNodes.first();
        jqMetadataFieldNode.children().each(function() {
            var tagName = this.tagName;
            var showSpotlight = $(this).attr("show_spotlight");
            showSpotlight = (showSpotlight === 'Y') ? 'Y' : 'auto';
            var tagVal = $(this).html();
            //alert(tagName + ':' + tagVal);
            myMetadataFieldSettingsDictionary[tagName] = { title: tagVal, showSpotlight: showSpotlight };
        });
    }

    // 2017-05-15: feature analysis tags
    var myFeatureAnalysisTagDictionary = { spotlights:{}, tags:{} };
    var jqXmlNodes = jqXml.find("ThdlPrototypeExport > corpus > feature_analysis > spotlight");
    var nextDisplayOrder = 1;
    jqXmlNodes.each(function() {
        var category = $(this).attr("category");
        var subCategory = $(this).attr("sub_category");
        var displayOrder = $(this).attr("display_order");
        var title = $(this).attr("title");
        myFeatureAnalysisTagDictionary['spotlights'][category + '/' + subCategory] = { displayOrder: displayOrder, title: title };
        nextDisplayOrder++;
    });

    var jqXmlNodes = jqXml.find("ThdlPrototypeExport > corpus > feature_analysis > tag");
    jqXmlNodes.each(function() {
        var type = $(this).attr("type");
        var name = $(this).attr("name");
        var defaultCategory = $(this).attr("default_category");
        var defaultSubCategory = $(this).attr("default_sub_category");
        myFeatureAnalysisTagDictionary['tags'][name] = { type: type, defaultCategory:defaultCategory, defaultSubCategory:defaultSubCategory };
    });

    var predefinedTags = ['PersonName', 'LocName', 'SpecificTerm', 'Date', 'Office'];
    jqXml.find("Document > *").each(function() {     // 2017-06-05: change filter from '*' to 'Document > *'
        var tagName = $(this).prop("tagName");
        if (predefinedTags.indexOf(tagName) >= 0 || tagName.startsWith("Udef_")) {
            if (typeof myFeatureAnalysisTagDictionary['tags'][tagName] === 'undefined') {
                var tagObj = { type: 'contentTagging',
                    defaultCategory: tagName,
                    defaultSubCategory: '-' };
                myFeatureAnalysisTagDictionary['tags'][tagName] = tagObj;
            }
        }
    });

    var dict = myFeatureAnalysisTagDictionary['tags'];
    for (var key in dict) {
        var spotlightKey = dict[key]['defaultCategory'] + '/' + dict[key]['defaultSubCategory'];
        var dict2 = myFeatureAnalysisTagDictionary['spotlights'];
        if (typeof dict2[spotlightKey] === 'undefined') {
            dict2[spotlightKey] = { displayOrder: nextDisplayOrder++,
                title: spotlightKey };
        }
    }
    //alert(JSON.stringify(myFeatureAnalysisTagDictionary));

    return { documentCount: fileDocuments,
        //dbRefdataList: myDbRefdataList,
        //corpusSettingList: myCorpusSettingList,
        metadataFieldSettingsDictionary: myMetadataFieldSettingsDictionary,
        docMetadataFieldsDictionary: myDictionary,
        userMetadataDictionary: userMetadataDictionary,
        featureAnalysisTagDictionary: myFeatureAnalysisTagDictionary
    };
}

function parseXmlStr(s, xmlFilename) {
    // 2017-06-05: assumes the string is a valid XML -- no need to do replacement
    // 2017-04-27: remove XML invalid characters, fixed by 陳琤 (Ref: https://mnaoumov.wordpress.com/2014/06/15/escaping-invalid-xml-unicode-characters/)
    //s = s.replace(/(.*?)((?:[\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])+)|(.)/g, '$2');         // too much recursion
    //s = s.replace(/(.*?)((?:[\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]){1,10})|(.)/g, '$2');    // less recursion, but is it a correct pattern?
    //s = s.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '_');      // 2016-05-09

    var docsInfo = getXmlDocsInfo(xmlFilename, s);
    var t = xmlFilename + " (" + docsInfo.documentCount + ")";
    $("#loadedFileBrief").html(t);

    MyXmlList[xmlFilename] = { text: s, docsInfo: docsInfo };    // store to global variable

    // 顯示文獻集中的 metadata 標籤
    var myList = [];       // 使用者可選擇「複製到」的欄位
    myList.push("<option value='" + UNCHANGE_STR + "'>" + UNCHANGE_STR + "</option>");
    myList.push("<option value='" + DELETE_STR + "'>" + DELETE_STR + "</option>");
    for (var key in ThdlMetadataFields) {
        myList.push("<option value='" + key + "'>" + key + "</option>");
    }

    var selectItemList = [];
    var n = 0;
    for (var key in docsInfo.docMetadataFieldsDictionary) {
        if (key === 'cue_category') continue;         // 2018-02-25
        if (typeof ThdlMetadataFields[key] !== 'undefined') {
            var s = "<select class='selectNewMetadataField' data-from='" + key + "'>" + myList.join('') + "</select>";
            var t = "<tr class='fileInfo'>" +
                "<td class='fileInfo' align='right'>" + (++n) + ".</td>" +
                "<td class='fileInfo'>" + key + "</td>" +
                "<td class='fileInfo'>" + ThdlMetadataFields[key].description + "</td>" +
                "<td class='fileInfo'>" + s + "</td>" +
                "</tr>";
            selectItemList.push(t);
        }
    }

    // 2017-05-30: 使用者自訂的 metadata 欄位...
    for (var key in docsInfo.userMetadataDictionary) {
        var field = docsInfo.userMetadataDictionary[key];
        var s = "<select class='selectNewMetadataField' data-from='xml_metadata/" + field + "'>" + myList.join('') + "</select>";
        var t = "<tr class='fileInfo'>" +
            "<td class='fileInfo' align='right'>" + (++n) + ".</td>" +
            "<td class='fileInfo'>xml_metadata/" + field + "</td>" +
            "<td class='fileInfo'>[使用者自訂標籤]</td>" +
            "<td class='fileInfo'>" + s + "</td>" +
            "</tr>";
        selectItemList.push(t);
    }

    // 將可後分類的 metadata 欄位和使用者自訂 metadata 都顯示出來...
    var t = selectItemList.join();
    $("#xmlMetadataFields").append(t).wrapAll('<div style="overflow: auto; height: 300px"/>');

    // 顯示文獻集中，可用作後分類的 metadata 標籤
    // 注意：即使不能運用在後分類，metadata 標籤仍然可以有 title...
    //       若使用者「新增」了一個標籤，在此並不會顯示 ==> 日後有機會改進時，可以在使用者操作後，動態加上去
    var filteredList = [];
    var n = 0;

    for (var key in docsInfo.docMetadataFieldsDictionary) {
        if (key === 'corpus') continue;                     // corpus 除外

        if ((typeof ThdlMetadataFields[key] !== 'undefined')) {
            if (typeof docsInfo.metadataFieldSettingsDictionary[key] !== 'undefined') {
                var myTitle = docsInfo.metadataFieldSettingsDictionary[key].title;
                var showSpotlight = docsInfo.metadataFieldSettingsDictionary[key].showSpotlight;
            }
            else {    // default value
                var myTitle = ThdlMetadataFields[key].pcTitle;;
                var showSpotlight = 'auto';
            }

            var spOptions = [];       // 「是否強迫顯示」的選項
            spOptions.push("<option value='auto'" + ((showSpotlight==='auto') ? " selected='selected'" : '') + ">auto</option>");
            spOptions.push("<option value='showSpotlight'" + ((showSpotlight==='Y') ? " selected='selected'" : '') + ">showSpotlight</option>");

            if (myTitle === '-') myTitle = key;
            var pcTag = (ThdlMetadataFields[key].pcTitle !== '-') ? 'Y' : 'N';
            var s = (pcTag === 'Y') ? "<input class='inputMetadataTitle' type='text' data-tag='" + key + "' value='" + myTitle + "' size='36'></input>" : "-";
            var s2 = (pcTag === 'Y') ? "<select class='selectShowSpotlight' data-tag='" + key + "'>" + spOptions.join('') + "</select>" : '-';
            var t = "<tr class='fileInfo'>" +
                "<td class='fileInfo' align='right'>" + (++n) + ".</td>" +
                "<td class='fileInfo'>" + key + "</td>" +
                "<td class='fileInfo' align='center'>" + pcTag + "</td>" +
                "<td class='fileInfo'>" + ThdlMetadataFields[key].pcTitle + "</td>" +
                "<td class='fileInfo'>" + s + "</td>" +
                "<td class='fileInfo'>" + s2 + "</td>" +
                "</tr>";
            filteredList.push(t);
        }
    }
    $("#xmlMetadataTagTitle").append(filteredList.join());

    // 顯示 Tag Analysis 的標籤
    filteredList = [];
    n = 0;
    var spotlightsObj = docsInfo.featureAnalysisTagDictionary['spotlights'];
    var tagsObj = docsInfo.featureAnalysisTagDictionary['tags'];
    for (var tagsName in tagsObj) {          // key: tagName
        var spotlightKey = tagsObj[tagsName]['defaultCategory'] + '/' + tagsObj[tagsName]['defaultSubCategory'];
        var s = "<input class='inputTagTitle' type='text' data-key='" + spotlightKey + "' value='" + spotlightsObj[spotlightKey].title + "' size='36'></input>"
        var t = "<tr class='fileInfo'>" +
            "<td class='fileInfo' align='right'>" + (++n) + ".</td>" +
            "<td class='fileInfo'>" + tagsName + "</td>" +
            //"<td class='fileInfo'>" + spotlightKey + "</td>" +
            "<td class='fileInfo'>" + spotlightsObj[spotlightKey].title + "</td>" +
            "<td class='fileInfo'>" + s + "</td>" +
            "</tr>";
        filteredList.push(t);
    }
    $("#xmlFeatureAnalysisTagTitle").append(filteredList.join());

}

function readFileAndParseXml(file, evt) {
    var xmlFilename = file.name;
    // clean MyXmlList
	MyXmlList = {};
	currentDoc = 0;
    var fr = new FileReader();
    fr.addEventListener('load', function(evt) {
        if (typeof MyXmlList[xmlFilename] !== "undefined") {
            alert("File '" + xmlFilename + "' has been loaded");
            return;
        }
        var s = evt.target.result;
        parseXmlStr(s, xmlFilename);      // 2017-05-15
    });
    fr.readAsText(file, 'utf-8');
}

function replaceXmlData(myXmlObj) {     // 2017-05-16: 改傳入 myXmlObj
    var xml = myXmlObj.text;
    var docsInfo = myXmlObj.docsInfo;
    var xmlDocObj = $.parseXML(xml);            // returns XMLDocument
    var jqXml = $(xmlDocObj);                   // returns jQuery object
    //alert(JSON.stringify(jqXml));
    //alert($(jqXml).outerHTML);
    //alert(new XMLSerializer().serializeToString(xmlDocObj));

    // get metadata fields in charge
    var actionList = [];
    var lastMetadataTag = '';
    $(".selectNewMetadataField").each(function() {
        var dataFrom = $(this).attr("data-from");
        var dataTo = $(this).val();
        lastMetadataTag = dataFrom;
        if (dataTo !== UNCHANGE_STR && dataTo !== dataFrom) {
            actionList.push({from:dataFrom, to:dataTo});
        }
    });
    //alert(JSON.stringify(actionList));

    var temp = $("#newCorpusVal").val();
    var modifyCorpus = ($("#inputNewCorpus").prop("checked") && temp !== '') ? temp : false;

    // 對每篇文件進行欄位複製與取代
    var jqDocumentNodes = jqXml.find("ThdlPrototypeExport > documents > document");
    var jqDocumentXmlList = jqDocumentNodes.map(function(idx) {
        var docObj = {};
        for (var i=0; i<actionList.length; i++) {                   // copy from-values to docObj
            var fieldFrom = actionList[i]['from'];
            var fieldTo = actionList[i]['to'];
            fieldFrom = fieldFrom.replace("/", " > ");
            var jqNode = $(this).find(fieldFrom).first();   // 每篇文件下，最多只應有一個對應的節點
            if (fieldTo === DELETE_STR) jqNode.remove();
            else docObj[fieldTo] = jqNode.html();           // 'undefined' if the node does not exist
        }
        for (var fieldTo in docObj) {                      // copy docObj to to-values
            var jqNodes = $(this).find(fieldTo);
            if (jqNodes.length > 0) {
                var jqNode = $(this).find(fieldTo).first();     // 每篇文件下，最多只應有一個對應的節點
                jqNode.html(docObj[fieldTo]);
            }
            else {
                // insert after lastMetadataTag
                if (lastMetadataTag.indexOf("/") < 0) {     // 一般的後分類 metadata
                    var jqNode = $(this).find(lastMetadataTag).first();
                }
                else {
                    var jqNode = $(this).children().first();
                }
                var t = "<" + fieldTo + ">" + docObj[fieldTo] + "</" + fieldTo + ">";
                jqNode.after(t);
            }
        }
        if (modifyCorpus) {
            var jqNode = $(this).find("corpus").first();
            jqNode.html(modifyCorpus);
        }
    });

    // 重新設定 corpus settings
    var jqXmlCorpusNodes = jqXml.find("ThdlPrototypeExport > corpus");
    if (jqXmlCorpusNodes.length == 0) jqXml.find("ThdlPrototypeExport").append("<corpus></corpus>");
    else if (jqXmlCorpusNodes.length > 1) {
        // 2018-03-05: 若存有多份 <corpus> 設定，會導致建庫混淆。在此先僅保留第一份...
        alert("警告：存在 " + jqXmlCorpusNodes.length + " 份 corpus 參數設定。\n" +
            "經本工具處理後，將只留存第一份設定！");
        jqXmlCorpusNodes.each(function(idx) {
            if (idx > 0) $(this).remove();             // empty() 是移除所有子節點
        });
    }
    var jqXmlCorpusNode = jqXml.find("ThdlPrototypeExport > corpus").first();

    // 取代 metadata_field_settings
    var jqMetadataFieldNodes = jqXml.find("ThdlPrototypeExport > corpus > metadata_field_settings");
    if (jqMetadataFieldNodes.length == 0) jqXmlCorpusNode.append("<metadata_field_settings></metadata_field_settings>");
    var jqMetadataFieldNodes = jqXml.find("ThdlPrototypeExport > corpus > metadata_field_settings");
    jqMetadataFieldNodes.empty();
    var jqMetadataFieldNode = jqXml.find("ThdlPrototypeExport > corpus > metadata_field_settings").first();

    var metadataFields = {};          // 2018-04-03: 為了不重覆...
    $(".inputMetadataTitle").each(function() {
        var metadataField = $(this).attr("data-tag");
        var showSpotlight = $(".selectShowSpotlight[data-tag='" + metadataField + "']").first().val();
        showSpotlight = (showSpotlight === 'showSpotlight') ? 'Y' : 'auto';
        //alert(metadataField + ": " + showSpotlight);
        var t = "<" + metadataField + " show_spotlight='" + showSpotlight + "'>" + $(this).val() + "</" + $(this).attr('data-tag') + ">";
        metadataFields[metadataField] = t;
    });

    for (var key in metadataFields) {
        if (metadataFields.hasOwnProperty(key)) jqMetadataFieldNode.append(metadataFields[key]);
    }

    // 取代 feature_analysis
    var jqXmlNodes = jqXml.find("ThdlPrototypeExport > corpus > feature_analysis");
    if (jqXmlNodes.length == 0) jqXmlCorpusNode.append("<feature_analysis></feature_analysis>");
    var jqXmlNode = jqXml.find("ThdlPrototypeExport > corpus > feature_analysis").first();

    // 利用 docsInfo.featureAnalysisTagDictionary 的資訊，輸出 spotlight 和 tag
    var spotlightItems = [];
    var spotlights = docsInfo.featureAnalysisTagDictionary['spotlights'];
    for (var key in spotlights) {          // key := categegory/sub_category
        var tempArr = key.split("/");
        var spotlightTitle = $(".inputTagTitle[data-key='" + key + "']").first().val();
        var s = "<spotlight category='" + tempArr[0] + "' sub_category='" + tempArr[1] + "'"
            + " display_order='" + spotlights[key].displayOrder + "' title='" + spotlightTitle + "'/>";
        spotlightItems.push(s);
    }
    //alert(JSON.stringify(spotlightItems));

    var tagItems = [];
    var tags = docsInfo.featureAnalysisTagDictionary['tags'];
    for (var key in tags) {                // key := tagName
        var type = tags[key]['type'];
        var category = tags[key]['defaultCategory'];
        var subCategory = tags[key]['defaultSubCategory'];
        var s = "<tag type='" + type + "' name='" + key + "' default_category='" + category + "'"
            + " default_sub_category='" + subCategory + "'/>";
        tagItems.push(s);
    }
    //alert(JSON.stringify(tagItems));
    jqXmlNode.html(spotlightItems.join("\n") + tagItems.join("\n"));

    // 取得 final xml 並回傳
    var xml = jqXml.find("ThdlPrototypeExport").get(0).outerHTML;
    return xml;
}

function handleSelectInFile(evt) {
    //var outXmlFilename = $("#outXmlFilename").val().replace(/^(.+)\.xml$/, "$1" + ".xml");
    //$("#outXmlFilename").val(outXmlFilename)

    // 先簡單剖析檔案中有哪些資料（輸出時，需再剖析一次，取出欲輸出的資訊）
    let files = evt.target.files;           // FileList object
    for (let i=0; i < files.length; i++) {    // read selected files
        let inFilename = files[i].name;
        let outXmlFilename = inFilename.replace(/^(.+)\.xml$/, "M-" + "$1" + ".xml");
        $("#outXmlFilename").val(outXmlFilename);
        readFileAndParseXml(files[i], evt);  // store result to global variable MyXmlList
    }
}
function ReplaceBeforeExport(myXmlObj){
    var xmlDocObj = $.parseXML(myXmlObj);            // returns XMLDocument
    var jqXml = $(xmlDocObj);
    var xml = jqXml.find("ThdlPrototypeExport").get(0).outerHTML//.replace(/<udefforcolor>/g,"")
        //.replace(/<\/udefforcolor>/g,"")
        .replace(/locname/g,"LocName")
        .replace(/personname/g,"PersonName")
        .replace(/udef_/g,"Udef_")
        // .replace(/style=\"color: yellow;\"/g,"")
        // .replace(/style=\"color: darkgreen;\"/g,"");


    return xml;

}

$("button").click(function() {
    switch($(this).html()){
        case '\u25B6':
            // change html() to '\u25BC'
            $(this).html('\u25BC');
            break;
        case '\u25BC':
            // change html() to '\u25B6'
            $(this).html('\u25B6');
            break;
        default:
            // do nothing
            break;
    }
});

$("#selectInFile").bind('change', function(evt) {
    if( document.getElementById("selectInFile").files.length === 0 ){
        console.log("no files selected");
    } else {
        resetXmlMetadataInfo();
        handleSelectInFile(evt);
    }
});

$("#computeThdlExportXml").click(function() {
    currentDoc = 0;
    if (Object.getOwnPropertyNames(MyXmlList).length === 0) {
        alert("錯誤：尚未載入建庫檔");
        return;
    }
    for (var xmlFilename in MyXmlList) {                   // 目前只能處理一個檔案！
        var s = replaceXmlData(MyXmlList[xmlFilename]);    // 會用到頁面上的資訊來進行取代，因此不能先把頁面資訊清除...
        resetXmlMetadataInfo();                            // 計算後才能清除頁面資訊
        parseXmlStr(s, xmlFilename)
    }
});

$("#saveThdlExportXmlToFile").click(function() {
    if (Object.getOwnPropertyNames(MyXmlList).length === 0) {
        alert("錯誤：尚未載入建庫檔");
        return;
    }
    var outXmlFilename = $("#outXmlFilename").val();
    //alert(xmlFilename);

    for (var xmlFilename in MyXmlList) {         // 目前應只有一個檔案
        var outXmlFilename = $("#outXmlFilename").val();
        var out = '<?xml version="1.0"?>' + ReplaceBeforeExport(replaceXmlData(MyXmlList[xmlFilename]));
        var blob = new Blob([out], {type: "text/plain;charset=utf-8"});
        saveAs(blob, outXmlFilename);             // requires FileSaver.js
    }
});