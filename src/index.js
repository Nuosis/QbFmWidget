import InvRecordsJOIN from "../data/InvRecordJOIN.json"
import InvRecords from "../data/InvRecords.json"
import Inv from "../data/Inv.json"
import { queryQBO } from '../ClarityAPI/clarityApiQBO';

console.log('version', "1.0.0");

let invRecords = InvRecords
let invRecordsJOIN = InvRecordsJOIN
let inv = Inv
let type = "Bill"



let obj = {
  type,
  inv,
  invRecords,
  invRecordsJOIN,
  qbNo: ""
}

let state= {
  qbType: obj.type
}

//GLOBAL FUNCTIONS

/**
 * setQbData
 * @param {data} Object 
 * 
 * Workflow should be.
 *    declare default type
 *    use inv to get inv/bill nos based on type
 *    if init, load first inv/bill no
 *    get qbObj based on inv/bill no
 *    load line items
 */
window.setQbData = function(data) {
  addControls()
  const obj = JSON.parse(data);
  invRecords = obj.invRecords;
  invRecordsJOIN = obj.invRecordsJOIN;
  inv = obj.inv;
  const invNos = inv.filter(item => item.fieldData.type === "Invoice").map(item => item.fieldData.InvoiceNo);
  const billNos = inv.filter(item => item.fieldData.type === "Bill").map(item => item.fieldData.InvoiceNo);
  obj.type === "Invoice" ? qbNo = invNos[0]: qbNo = billNos[0]
  obj.qbNo = qbNo
  createHeader(state.qbType, qbNo);
  ;
}

/**
 * setType
 * @param {type} string
 * 
 * Workflow should be.
 *    update state type
 *    call setQbData(Obj)
 */
window.setType = function(type) {
  console.log("setType function called");
  obj.type = type
  // console.log({obj});
  createHeader(obj.type)
}



//FUNCTIONS

function sortFunction() {
  console.log("Sort function called");
  // Implementation of the sort functionality
}

function findDuplicates() {
  console.log("Find duplicates function called");
  // Implementation of finding duplicates
}

function showInfo() {
  console.log("Show info function called");
  // Implementation of showing info
}

function updateData() {
  console.log("Update data function called");
  // Implementation of updating data
}

/*
function extractTypeFromQBData(qbData) {
  const { QueryResponse } = qbData;
  const keys = Object.keys(QueryResponse);
  const nonTypeKeys = ['maxResults', 'startPosition', 'totalCount'];
  const typeKey = keys.find(key => !nonTypeKeys.includes(key));
  return typeKey;
}*/

function getNestedProperty(object, path, defaultValue) {
  return path.reduce((xs, x) => (xs && xs[x] != null ? xs[x] : defaultValue), object);
}

async function getQbObj(type,qbNo) {
  //get qbObj based on inv/bill no
  let result
  try{
    const table=`${type}`
    const query = [{
      key: "DocNumber",
      operator: "=",
      value: qbNo
    }]
    result = await queryQBO(table,query)
    return JSON.parse(result)
  } catch (error) {
    console.error('Error querying QBO:', error);
    return error
  }
}

//ELEMENTS
async function createHeader(type, qbNo) {
/**
 *    
 *    load line items
 */


  // confirm type
  if (!type) {
    console.error('No valid type key provided');
    return; // Exit if no type key found
  }

  const offType = type === "Invoice" ? "Bill" : "Invoice";
  
  //get qbObj based on inv/bill no
  data = await getQbObj(type,qbNo)
  console.log({data})

  if (!data || !data.QueryResponse || !data.QueryResponse[type] || !data.QueryResponse[type][0]) {
    console.error('Invalid response structure:', data);
    return;
  }

  const record = data.QueryResponse[type][0];

  inv = obj.inv;
  const invNos = inv.filter(item => item.fieldData.type === "Invoice").map(item => item.fieldData.InvoiceNo);
  const billNos = inv.filter(item => item.fieldData.type === "Bill").map(item => item.fieldData.InvoiceNo);
  // Render
  try {
    const oldDataHeader = document.getElementById('dataHeader');
    const oldButtonHeader = document.getElementById('buttonHeader');
    
    if (oldDataHeader) {
        oldDataHeader.parentNode.removeChild(oldDataHeader);
        console.log("dataHeader div removed");
    }
    
    if (oldButtonHeader) {
        oldButtonHeader.parentNode.removeChild(oldButtonHeader);
        console.log("buttonHeader div removed");
    }
  } catch (error) {
      console.log("div does not exist. Proceed");
  }
  const headerDiv = document.createElement('div');
  headerDiv.className = 'header w-4/5';
  headerDiv.id = 'dataHeader';  // Corrected to use string for ID

  let customerField = type === "Invoice" ? record.CustomerRef.name : record.VendorRef.name;
  headerDiv.innerHTML = `<div class="pb-2 text-3xl">${type} Details</div>
      <div class="flex flex-row mt-2 gap-4">
        <p><strong>Customer:</strong> ${customerField}</p>
        <p><strong>Doc Number:</strong> ${record.DocNumber}</p>
        <p><strong>Date:</strong> ${record.TxnDate}</p>
        <p><strong>Total Amount:</strong> $${record.TotalAmt}</p>
      </div>`;

  document.getElementById('Header').appendChild(headerDiv);

  const headerButtonDiv = document.createElement('div');
  headerButtonDiv.className = `headerButtons w-1/5 flex flex-row gap-2`;
  headerButtonDiv.id = 'buttonHeader';  // Corrected to use string for ID

  // Prepare the dropdown options based on the type
  const dropdown = document.createElement('select');
  dropdown.className = 'cursor-pointer dark:bg-gray-800';
  dropdown.addEventListener('change', function() {
    createHeader(type, this.value);
  });

  if (type === "Invoice") {
      invNos.forEach(no => {
          const option = document.createElement('option');
          option.value = no;
          option.textContent = no;
          dropdown.appendChild(option);
      });
  } else if (type === "Bill") {
      billNos.forEach(no => {
          const option = document.createElement('option');
          option.value = no;
          option.textContent = no;
          dropdown.appendChild(option);
      });
  }

  // Set the value of the dropdown after appending all options
  dropdown.value = qbNo;

  headerButtonDiv.innerHTML = `
      <span class="material-icons cursor-pointer" onclick="setType('${offType}')">
          radio_button_checked
      </span>
      <div class="cursor-pointer" onclick="setType('${offType}')">${type}</div>

  `;
  // Append the dropdown last to ensure it appears at the end
  headerButtonDiv.appendChild(dropdown);
  document.getElementById('Header').appendChild(headerButtonDiv);

  //create lines
  createLineItems(data)
}

function createLineItems(data) {
  const type = obj.type 
  if (!type) {
    console.error('No valid type key found in QueryResponse');
    return; // Exit if no type key found
  }
  const items = data.QueryResponse[type][0].Line
  const tableBody = document.getElementById('tableBody');
  if(type==="Invoice"){
    items.forEach(item => {
        // Safely retrieve nested properties
        const id=item.Id
        const description = item.Description ? item.Description :  '|!|';
        const itemName = getNestedProperty(item, ['SalesItemLineDetail', 'ItemRef', 'name'], '|!|').split(':').pop();
        const rawUnitPrice = getNestedProperty(item, ['SalesItemLineDetail', 'UnitPrice'], '|!|');
        const unitPrice = isNaN(parseFloat(rawUnitPrice)) ? '|!|' : parseFloat(rawUnitPrice).toFixed(2);
        const quantity = getNestedProperty(item, ['SalesItemLineDetail', 'Qty'], '|!|');
        const taxCodeRefValue = getNestedProperty(item, ['SalesItemLineDetail', 'TaxCodeRef', 'value'], '|!|');
        const rawAmount = item.Amount || '|!|';
        const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2);

        // Determine tax status based on taxCodeRefValue
        let taxStatus;
        if (taxCodeRefValue === '4') {
            taxStatus = 'GST';
        } else if (taxCodeRefValue === '6') {
            taxStatus = 'OOS';
        } else {
            taxStatus = taxCodeRefValue;
        }

        const row = document.createElement('tr');
        row.id=id
        const isLinked = invRecordsJOIN.some(record => record._qbID === item.qbID && record._qbLineID === item.LineId);
        const linkBlock = isLinked ? `
            <span class="material-icons cursor-pointer" onClick=showInfo(this)>
                link
            </span>` : `
            <span class="material-icons text-yellow-200 opacity-25 hover:opacity-75">
                link_off
            </span>`
        row.innerHTML = `
            <td class="border px-4 py-2 dark:border-gray-500 text-gray-400 text-center">
                ${linkBlock}
            </td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${description}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${itemName}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${unitPrice}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${quantity}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${taxStatus}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${amount}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400 text-center">
                <button class="material-icons cursor-pointer opacity-25 hover:opacity-75 text-red-500" onclick="deleteRow(this)">
                    cancel
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    

    });
  } else {
    items.forEach(item => {
        // Safely retrieve nested properties
        const id=item.Id
        const description = item.Description ? item.Description :  '|!|';
        const itemName = getNestedProperty(item, ['AccountBasedExpenseLineDetail', 'AccountRef', 'name'], '|!|').split(':').pop();
        const rawUnitPrice = item.Amount ? item.Amount :  '|!|';
        const unitPrice = isNaN(parseFloat(rawUnitPrice)) ? '|!|' : parseFloat(rawUnitPrice).toFixed(2);
        const quantity = item.Qty ? item.Qty :  1;
        const taxCodeRefValue = getNestedProperty(item, ['AccountBasedExpenseLineDetail', 'TaxCodeRef', 'value'], '|!|');
        //const rawAmount = item.Amount ? item.Amount : '|!|';
        //const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2);

        // Determine tax status based on taxCodeRefValue
        let taxStatus;
        if (taxCodeRefValue === '4') {
            taxStatus = 'GST';
        } else if (taxCodeRefValue === '6') {
            taxStatus = 'OOS';
        } else {
            taxStatus = taxCodeRefValue;
        }
        const rawAmount = taxStatus==='GST' ? unitPrice*1.05:unitPrice
        const amount = isNaN(parseFloat(rawAmount)) ? '|!|' : parseFloat(rawAmount).toFixed(2)


        const row = document.createElement('tr');
        row.id = id
        const isLinked = invRecordsJOIN.some(record => record._qbID === item.qbID && record._qbLineID === item.LineId);
        const linkBlock = isLinked ? `
                        <span class="material-icons cursor-pointer" onClick=showInfo(this)>
                            link
                        </span>` : `
                        <span class="material-icons text-yellow-200 opacity-25 hover:opacity-75">
                            link_off
                        </span>`
        row.innerHTML = `
            <td class="border px-4 py-2 dark:border-gray-500 text-gray-400 text-center">
                ${linkBlock}
            </td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${description}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${itemName}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${unitPrice}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${quantity}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">${taxStatus}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400">$${amount}</td>
            <td class="border px-4 py-2 dark:border-gray-500 dark:text-gray-400 text-center">
                <button class="material-icons cursor-pointer opacity-25 hover:opacity-75 text-red-500" onclick="deleteRow(this)">
                    cancel
                </button>
            </td>
        `;
        tableBody.appendChild(row);

    });

  }
}

function addControls() {
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'controls flex flex-row py-4 gap-2';
  controlsDiv.innerHTML = `
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="sortItems()">Sort</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="findDuplicates()">Find Duplicates</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="showInfo()">Show Info</button>
      <button class="py-2 px-4 bg-blue-500 opacity-75 dark:bg-cyan-800 text-white dark:text-gray-300 rounded-md" onclick="updateItems()">Update</button>`;
  document.getElementById('app').appendChild(controlsDiv);
}

setQbData(JSON.stringify(obj))
