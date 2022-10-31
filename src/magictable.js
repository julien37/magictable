// Global variables
let gTriggerNewScroll = 1;
let gTableHeight;
let gLastTableHeight;
let gLimit;
let gPagination;
let gDataModel;
let gIsEditing;
let gEditingCellPosition;
let gNumberColumns = 0;
let gNumberLines = 0;
let gIsEditable;
let gIsDeletable;
let gTable;
let gValueSearched = "";
let gGetApi;
let gProperty;
let gUpdateApi;
let gDeleteApi;
let gSearchWithApi;

function apiRequestor(apiUrl,params) {
    let apiResponse;
    let url;
    if (gLimit > 0) {
        url = apiUrl + "&" + params;
    } else {
        url = apiUrl;
    }

    $.ajax({
        url:url,
        method:"GET",
        dataType: "json",
        async:false,
        success:function(data){
            if (gProperty !== '') {
                apiResponse = data[gProperty];
            } else {
                apiResponse = data;
            }
        }
    });
    return apiResponse;
}

function updateCellsPosition() {
    let idRow = 0;
    let idColumn = 0;

    $("td.mf-table-data-cells").each(function() {
        $(this).attr('data-position',idRow + '-' + idColumn);
        idColumn++

        if (idColumn === gNumberColumns) {
            idColumn = 0;
            idRow++;
        }
    });
}

// Save modification
function saveEditing(cellPosition) {
    let cellNewValue = $('#input-' + cellPosition).val();
    let tdSelector = $("td[data-position='"+cellPosition+"']");

    let rowId = $(tdSelector).data('id');
    let field = $(tdSelector).data('field');
    let jsonPayload = {};

    $.each(gDataModel, function(index,value) {
        if (field === index) {
            jsonPayload[value['field']] = cellNewValue;
            return false;
        }
    });

    gUpdateApi = gUpdateApi.replace('{rowId}',rowId);

    $.ajax({
        url:gUpdateApi,
        method:"POST",
        dataType:"json",
        data:{payload:JSON.stringify(jsonPayload)},
        success:function(data){}
    });

    // Hide input field
    if (Array.isArray(cellNewValue)) {
        $("td[data-position='"+cellPosition+"']").html(JSON.stringify(cellNewValue));
    } else {
        $("td[data-position='"+cellPosition+"']").html(cellNewValue);
    }
    gIsEditing = 0;
}

// Main function
function Magictable(getApi,property,updateApi,deleteApi,limit,dataModel,editable,deletable,searchWithApi) {
    gLimit = limit;
    gPagination = 0;
    gDataModel = dataModel;
    gTriggerNewScroll = 1;

    gIsEditable = editable;
    gIsDeletable = deletable;

    gGetApi = getApi;
    gProperty = property;
    gUpdateApi = updateApi;
    gDeleteApi = deleteApi;
    gSearchWithApi = searchWithApi;

    if (typeof gDataModel !== 'object') {
        $.ajax({
            url:dataModel,
            method:"GET",
            dataType:"json",
            success:function(data){
                let dataModel = {};
                $.each(data, function(index, value) {
                    try {
                        dataModel[value['label']] = {field:value['field'], fieldType: value['fieldType'], picklist: JSON.parse(value['picklist']),editable:true};
                    } catch (e) {
                        dataModel[value['label']] = {field:value['field'], fieldType: value['fieldType'], picklist: value['picklist'],editable:true};
                    }
                });
                gDataModel = dataModel;
            }
        });
    }

    let htmlLayout = '<table class="mf-table-main">';
    let apiResponse = apiRequestor(gGetApi, "limit=" + gLimit + "&pagination=" + gPagination);
    let indexCol;
    let rowId;

    gNumberLines = 0;
    $.each(apiResponse, function(index, row) {
        indexCol = 0;
        // Create table header
        if (index === 0) {
            htmlLayout += '<thead">';
            htmlLayout += '<tr class="mf-table-row-element header">';
            if (gIsDeletable === true) {
                htmlLayout += '<th data-exclude="true" class="mf-table-header-delete"><input id="input-main-checkbox" type="checkbox"></th>';
            } else {
                htmlLayout += '<th data-exclude="true" class="mf-table-header-delete"></th>';
            }

            $.each(row, function(column) {
                htmlLayout += '<th class="mf-table-header-cells">'+column+' <i class="fa fa-sort"></i></th>';
                gNumberColumns++;
            });

            htmlLayout += '</thead>';
            htmlLayout += '</tr>';
            htmlLayout += '<tbody id="mf-table-body">';
        }
        // Table content
        if (index % 2 === 0) {
            htmlLayout += '<tr class="mf-table-row-element even">';
        } else {
            htmlLayout += '<tr class="mf-table-row-element odd">';
        }

        if (gIsDeletable === true) {
            htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"><input class="mf-input-delete" type="checkbox"></td>';
        } else {
            htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"></td>';
        }

        $.each(row, function(i,value) {
            if (indexCol === 0) {
                rowId = value;
            }
            htmlLayout += '<td class="mf-table-data-cells" data-position="'+index+'-'+indexCol+'" data-field="'+Object.keys(row)[indexCol]+'" data-id="'+rowId+'">'+value+'</td>';
            indexCol++;
        });
        htmlLayout += '</tr>';
        gNumberLines++;
    });
    htmlLayout += '</tbody>';
    htmlLayout += '</table>';

    $('#table').html(htmlLayout);
    $('#mt-number-lines').html("Rows loaded: " + gNumberLines)
    return gNumberLines;
}

function tableExport() {
    let table = document.getElementsByTagName("table");
    TableToExcel.convert(table[0], { // html code may contain multiple tables so here we are refering to 1st table tag
        name: `export.xlsx`, // fileName you could use any name
        sheet: {
            name: 'Sheet 1' // sheetName
        }
    });
}

// Search in table
function searchInTable(apiSearch) {
    gValueSearched = $('#input-search-value').val();
    let x = 0;
    let rowId;

    if (gValueSearched.length > 0) {
        $('#mt-btn-remove-search').removeClass('d-none');

        if (apiSearch === true) {
            let apiResponse = apiRequestor(gGetApi, "keyword=" + gValueSearched);
            let htmlLayout = "";
            $.each(apiResponse, function(index, row) {
                let newIndexValue = index;
                let indexCol = 0;

                // Table content
                if (index % 2 === 0) {
                    htmlLayout += '<tr class="mf-table-row-element even">';
                } else {
                    htmlLayout += '<tr class="mf-table-row-element odd">';
                }

                if (gIsDeletable === true) {
                    htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"><input class="mf-input-delete" type="checkbox"></td>';
                } else {
                    htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"></td>';
                }

                $.each(row, function(i,value) {
                    if (indexCol === 0) {
                        rowId = value;
                    }
                    htmlLayout += '<td class="mf-table-data-cells" data-position="'+newIndexValue+'-'+indexCol+'" data-field="'+Object.keys(row)[indexCol]+'" data-id="'+rowId+'">'+value+'</td>';
                    indexCol++;
                });
                htmlLayout += '</tr>';
                x++;
            });
            $('#mf-table-body').html(htmlLayout);
            $('#mt-number-lines').html("Rows loaded: " + x)
        } else {
            let x = 0;
            $("tr").each(function() {
                if (!$(this).hasClass("header")) {
                    let hideLine = 1;
                    $(this).find('td').each(function() {
                        if ($(this).text().toLowerCase().includes(gValueSearched.toLowerCase())) {
                            hideLine = 0;
                        }
                    });
                    if (hideLine === 1) {
                        $(this).addClass('d-none');
                        console.log($(this).text());
                    }
                }
            });
        }
    }
}

gTable = $("#table");

// Highlight cells on click
$(gTable).on("click", "td.mf-table-data-cells", function(){
    if (!$(this).hasClass('cells-selector')) {
        $('tr').each (function() {
            $(this).removeClass('selected-row');
        });
    }

    if (!$(this).hasClass('cells-selector')) {
        if (gIsEditing === 1 && gEditingCellPosition !== $(this).data('position')) {
            saveEditing(gEditingCellPosition);
        }
        $('.mf-table-data-cells').removeClass('selected-cell');
        $(this).addClass('selected-cell');
    }
});

// Select entire row
$(gTable).on("click", "td.cells-selector", function(){
    $('.mf-table-data-cells').removeClass('selected-cell');

    if (!$(this).closest('tr').hasClass('selected-row')) {
        $('tr').each (function() {
            $(this).removeClass('selected-row');
        });
        $(this).closest('tr').addClass('selected-row');
    } else {
        $(this).closest('tr').removeClass('selected-row');
    }
});

// Editing
$(gTable).on("dblclick", "td.mf-table-data-cells", function(){
    let fieldFound = 0;
    if (gIsEditing === 1) {
        return false;
    }

    if (gIsEditable === false) {
        return false;
    }
    let fieldName = $(this).data('field');
    let fieldType = "";
    let listValues;
    gEditingCellPosition = $(this).data('position');

    $.each(gDataModel, function(index,value) {
        if (fieldName === index) {
            fieldType = value['fieldType'];
            if (value['editable'] === true) {
                fieldFound = 1;
                listValues = value['picklist'];
            }
            return false;
        }
    });

    if (fieldFound === 1) {
        gIsEditing = 1;
        let cellActiveValue = $(this)[0].innerText;
        let inputWidth = ($(this).width() * 0.2) + $(this).width();
        let htmlLayout;

        switch (fieldType) {
            case 'text':
                htmlLayout = '<input type="text" class="mf-input" id="input-'+gEditingCellPosition+'" value="'+cellActiveValue+'" style="width: '+inputWidth+'px;">';
                break;
            case 'number':
                htmlLayout = '<input type="number" class="mf-input" id="input-'+gEditingCellPosition+'" value="'+cellActiveValue+'" style="width: '+inputWidth+'px;">';
                break;
            case 'date':
                htmlLayout = '<input type="date" class="mf-input" id="input-'+gEditingCellPosition+'" value="'+cellActiveValue+'" style="width: '+inputWidth+'px;">';
                break;
            case 'time':
                htmlLayout = '<input type="time" class="mf-input" id="input-'+gEditingCellPosition+'" value="'+cellActiveValue+'" style="width: '+inputWidth+'px;">';
                break;
            case 'picklist':
                htmlLayout = '<select id="input-'+gEditingCellPosition+'">'
                $.each(listValues, function(index,value) {
                    if (value === cellActiveValue) {
                        htmlLayout += '<option value="'+value+'" selected>'+value+'</option>';
                    } else {
                        htmlLayout += '<option value="'+value+'">'+value+'</option>';
                    }
                });
                htmlLayout += '</select>'
                break;
            case 'multilist':
                htmlLayout = '<select id="input-'+gEditingCellPosition+'" multiple>'
                $.each(listValues, function(index,value) {
                    try {
                        if (JSON.parse(cellActiveValue).indexOf(value) > -1) {
                            htmlLayout += '<option value="'+value+'" selected>'+value+'</option>';
                        } else {
                            htmlLayout += '<option value="'+value+'">'+value+'</option>';
                        }
                    } catch (e) {
                        htmlLayout += '<option value="'+value+'">'+value+'</option>';
                    }
                });
                htmlLayout += '</select>'
                break;
            case 'comment':
                htmlLayout = '<textarea id="input-'+gEditingCellPosition+'" style="width: '+inputWidth+'px;" rows="3">'+cellActiveValue+'</textarea>';
                break;
            default:
                htmlLayout = '<input type="text" class="mf-input" id="input-'+gEditingCellPosition+'" value="'+cellActiveValue+'" style="width: '+inputWidth+'px;">';
        }
        $(this).html(htmlLayout);
    }
});

// Scroll management
$(gTable).on( 'scroll', function(){
    let lastCellPosition = $( "td.mf-table-data-cells" ).last().data('position').split('-');
    gTableHeight = $("div td[data-position='"+lastCellPosition[0]+"-"+lastCellPosition[1]+"']").position().top;
    let scrollTopPositionTable = $( "#table" ).scrollTop();
    let divHeight = $('#table').height() - 25;
    let rowId;

    if ((gTableHeight - divHeight - 50) < scrollTopPositionTable && gTriggerNewScroll === 1 && gValueSearched.length === 0 && gLimit > 0){
        let x = 0
        gTriggerNewScroll = 0;

        $( "tr.mf-table-row-element").each(function() {
            x++;
        });

        let pagination = x -1;
        gPagination = pagination;
        let apiResponse = apiRequestor(gGetApi, "limit=" + gLimit + "&pagination=" + pagination);

        let htmlLayout = "";
        $.each(apiResponse, function(index, row) {
            let newIndexValue = index + pagination;
            let indexCol = 0;

            // Table content
            if (index % 2 === 0) {
                htmlLayout += '<tr class="mf-table-row-element even">';
            } else {
                htmlLayout += '<tr class="mf-table-row-element odd">';
            }

            if (gIsDeletable === true) {
                htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"><input class="mf-input-delete" type="checkbox"></td>';
            } else {
                htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"></td>';
            }

            $.each(row, function(i,value) {
                if (indexCol === 0) {
                    rowId = value;
                }
                htmlLayout += '<td class="mf-table-data-cells" data-position="'+newIndexValue+'-'+indexCol+'" data-field="'+Object.keys(row)[indexCol]+'" data-id="'+rowId+'">'+value+'</td>';
                indexCol++;
            });
            htmlLayout += '</tr>';
            gNumberLines++;
        });

        $('#mf-table-body').append(htmlLayout);
        $('#mt-number-lines').html("Rows loaded: " + gNumberLines)

        if (gLastTableHeight !== gTableHeight) {
            gTriggerNewScroll = 1;
        }
        gLastTableHeight = $("div td[data-position='"+lastCellPosition[0]+"-"+lastCellPosition[1]+"']").position().top
    }
});

// Sort management
$(gTable).on("click", "th.mf-table-header-cells", function(){
    let table = $(this).parents('table').eq(0)
    let rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()))
    this.asc = !this.asc
    if (!this.asc){rows = rows.reverse()}
    for (let i = 0; i < rows.length; i++){table.append(rows[i])}
    updateCellsPosition();
})
function comparer(index) {
    return function(a, b) {
        let valA = getCellValue(a, index), valB = getCellValue(b, index)
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
    }
}
function getCellValue(row, index){ return $(row).children('td').eq(index).text() }

// Manage cells move with arrow keys
$("body").keydown(function(e) {
    let lastCellPosition = $( "td.mf-table-data-cells" ).last().data('position').split('-');
    let lastCellindexRow = parseInt(lastCellPosition[0]);
    let lastCellindexCol = parseInt(lastCellPosition[1]);
    let divHeight = $(gTable).height() - 25;
    let divWidth = $(gTable).width();


    if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
        if (gIsEditing === 1 && gEditingCellPosition !== $(this).data('position')) {
            saveEditing(gEditingCellPosition);
        }
    }

    $( "td.mf-table-data-cells").each(function() {
        if ($(this).hasClass('selected-cell')) {
            let position = $(this).data('position').split('-');
            let newPosition;

            let indexRow = parseInt(position[0]);
            let indexCol = parseInt(position[1]);

            $(this).removeClass('selected-cell');

            if(e.keyCode === 37) { // left
                if (indexCol > 0) {
                    indexCol = indexCol - 1;
                }
            }
            if(e.keyCode === 38) { // up
                if (indexRow > 0) {
                    indexRow = indexRow - 1;
                }
            }
            if(e.keyCode === 39) { // right
                if (indexCol < lastCellindexCol) {
                    indexCol = indexCol + 1;
                }
            }
            if(e.keyCode === 40) { // bottom
                if (indexRow < lastCellindexRow) {
                    indexRow = indexRow + 1;
                }
            }

            newPosition = indexRow + "-" + indexCol;
            $("td[data-position='"+newPosition+"']").addClass('selected-cell');

            let scrollTopPositionTable = $( gTable ).scrollTop();
            let scrollTopPositionCell = $("div td[data-position='"+newPosition+"']").position().top;

            let scrollLeftPositionTable = $( gTable ).scrollLeft();
            let scrollLeftPositionCell = $("div td[data-position='"+newPosition+"']").position().left;

            // Deal with scroll position
            if (scrollTopPositionCell <= scrollTopPositionTable || scrollTopPositionCell >= scrollTopPositionTable + divHeight) {
                if(e.keyCode === 38) { // up
                    let newSrollPositionTop = $("div td[data-position='"+newPosition+"']").position().top - 23 // 23 = row height
                    $( "#table" ).scrollTop(newSrollPositionTop);
                }
                if(e.keyCode === 40) { // bottom
                    let newSrollPositionBottom = $("div td[data-position='"+newPosition+"']").position().top - divHeight
                    $( "#table" ).scrollTop(newSrollPositionBottom);
                }
            }

            if (scrollLeftPositionCell <= scrollLeftPositionTable || scrollLeftPositionCell >= scrollLeftPositionTable + (divWidth - 5)) {
                if(e.keyCode === 37) { // left
                    let newSrollPositionLeft;
                    if (indexCol > lastCellindexCol) {
                        indexCol --;
                        newPosition = indexRow + "-" + indexCol;
                        newSrollPositionLeft = ($("div td[data-position='"+newPosition+"']").position().left  + 2) - divWidth
                    } else {
                        newSrollPositionLeft = $("div td[data-position='"+newPosition+"']").position().left
                    }
                    $( "#table" ).scrollLeft(newSrollPositionLeft);
                }
                if(e.keyCode === 39) { // right
                    let newSrollPositionRight;
                    if (indexCol < lastCellindexCol) {
                        indexCol ++;
                        newPosition = indexRow + "-" + indexCol;
                        newSrollPositionRight = ($("div td[data-position='"+newPosition+"']").position().left  + 2) - divWidth
                    } else {
                        newSrollPositionRight = $("div td[data-position='"+newPosition+"']").position().left
                    }
                    $( "#table" ).scrollLeft(newSrollPositionRight);
                }
            }
            return false;
        }
    });
});

//Delete management
$('#mt-btn-delete').click(function(){
    if (gIsDeletable === false) {
        return false;
    }

    if (!confirm("Are you sure to delete selected rows?")){
        return false;
    }
    let idsToDelete = [];
    let x = 0;
    $("input.mf-input-delete").each(function() {
        if ($(this).is(":checked")) {
            idsToDelete.push($(this).closest('td').next().attr('data-id'));
            $(this).closest('tr').remove();
            x++;
        }
    });

    if (x > 0) {
        $.ajax({
            url:gDeleteApi,
            method:"POST",
            dataType:"json",
            data:{references:JSON.stringify(idsToDelete)},
            success:function(data){}
        });
    }
});

$('#mt-btn-update').click(function(){
    let x = 0;
    let rowId;

    $( "tr.mf-table-row-element").each(function() {
        x++;
    });
    x--;

    let apiResponse = apiRequestor(gGetApi, "limit=" + x + "&pagination=0");
    let htmlLayout = "";
    $.each(apiResponse, function(index, row) {
        let newIndexValue = index;
        let indexCol = 0;

        // Table content
        if (index % 2 === 0) {
            htmlLayout += '<tr class="mf-table-row-element even">';
        } else {
            htmlLayout += '<tr class="mf-table-row-element odd">';
        }

        if (gIsDeletable === true) {
            htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"><input class="mf-input-delete" type="checkbox"></td>';
        } else {
            htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"></td>';
        }

        $.each(row, function(i,value) {
            if (indexCol === 0) {
                rowId = value;
            }
            htmlLayout += '<td class="mf-table-data-cells" data-position="'+newIndexValue+'-'+indexCol+'" data-field="'+Object.keys(row)[indexCol]+'" data-id="'+rowId+'">'+value+'</td>';
            indexCol++;
        });
        htmlLayout += '</tr>';
    });
    $('#mf-table-body').html(htmlLayout);
    $('#mt-number-lines').html("Rows loaded: " + x)

});




$('#mt-btn-search').click(function(){
    searchInTable(gSearchWithApi);
});

$('#mt-btn-remove-search').click(function(){
    gValueSearched = "";
    $('#input-search-value').val("");

    $('#mt-btn-remove-search').addClass('d-none');
    $('#mt-btn-search').removeClass('d-none');

    let x = 0;
    let rowId;

    if (gValueSearched.length === 0) {
        let apiResponse = apiRequestor(gGetApi, "limit=" + gLimit + "&pagination=0");

        let htmlLayout = "";
        $.each(apiResponse, function(index, row) {
            let newIndexValue = index;
            let indexCol = 0;

            // Table content
            if (index % 2 === 0) {
                htmlLayout += '<tr class="mf-table-row-element even">';
            } else {
                htmlLayout += '<tr class="mf-table-row-element odd">';
            }

            if (gIsDeletable === true) {
                htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"><input class="mf-input-delete" type="checkbox"></td>';
            } else {
                htmlLayout += '<td data-exclude="true" class="mf-table-data-cells cells-selector" data-id="'+rowId+'"></td>';
            }

            $.each(row, function(i,value) {
                if (indexCol === 0) {
                    rowId = value;
                }
                htmlLayout += '<td class="mf-table-data-cells" data-position="'+newIndexValue+'-'+indexCol+'" data-field="'+Object.keys(row)[indexCol]+'" data-id="'+rowId+'">'+value+'</td>';
                indexCol++;
            });
            htmlLayout += '</tr>';
            x++;
        });
        $('#mf-table-body').html(htmlLayout);
        $('#mt-number-lines').html("Rows loaded: " + x)

        gTriggerNewScroll = 1;
        gNumberLines = gLimit;

    }
});

$(gTable).on("change", "input#input-main-checkbox", function(){
    if ($(this).is(":checked")) {
        $("input.mf-input-delete").each(function() {
            $(this).prop( "checked", true );
        });
    } else {
        $("input.mf-input-delete").each(function() {
            $(this).prop( "checked", false );
        });
    }
});

// Disable default scroll on key press
window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

$(document).on('keypress',function(e) {
    if(e.which == 13) {
        searchInTable(gSearchWithApi);
    }
});