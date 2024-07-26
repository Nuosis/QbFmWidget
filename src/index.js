import { Table } from './Table.js'
import { readRecord } from '../FileMaker/readRecord.js';
import { config } from '../.env.js';

console.log('version', "1.1.0");
console.log({config})

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

window.init = async function(month, year) {
  console.log("Initializing QBO Interface") 
  if (!month) {
      // Get current month number (1-12)
      const currentDate = new Date();
      month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Ensure two digits
  }
  if (!year) {
      // Get current year (yyyy)
      year = new Date().getFullYear().toString();
  }
  console.log({month},{year})

  let fmData = JSON.parse(sessionStorage.getItem('fmData'));
  if (!fmData) {
      await initFmData(month, year);
      fmData = JSON.parse(sessionStorage.getItem('fmData'));
  }
  if (!fmData) {
      throw new Error("Error on getting data from FileMaker");
  }

  console.log("FileMaker data successfully retrieved:", {fmData});
  const invNos = fmData.Inv.filter(item => item.fieldData.type === "Invoice").map(item => item.fieldData.InvoiceNo);
  const billNos = fmData.Inv.filter(item => item.fieldData.type === "Bill").map(item => item.fieldData.InvoiceNo);

  sessionStorage.setItem('invNos', JSON.stringify({invNos}));
  sessionStorage.setItem('billNos', JSON.stringify({billNos}));

  Table()
};

window.initFmData = async function(month,year) {
  let query = [
    {month,year}
  ];
  let userLayout = "dapi_Invoice"
  let Inv
  try{
      //GET USER INFO
      const filemakerUserObject = await readRecord(config.NODE_TOKEN,{query},userLayout)
      if(filemakerUserObject.length===0){
          throw new Error("Error on getting Invoice info from FileMaker")
      }
      console.log("Inv fetch successfull ...")
      Inv = filemakerUserObject.response.data  
      // console.log({Inv})
  } catch (error) {
      console.error('Getting User Data Error:', error);
      alert('Failed to gather Invoice Records'); // Display custom alert message
      return false;
  }

  let InvRecords
  let layout = "dapi_InvoiceRecords"  
  query = [
    {
      "dateMonth": month,
      "dateYear": year
    }
  ];

  try{
      //GET USER INFO
      const filemakerUserObject = await readRecord(config.NODE_TOKEN,{query},layout)
      if(filemakerUserObject.length===0){
          throw new Error("Error on getting InvoiceRecords info from FileMaker")
      }
      console.log("InvRecords fetch successfull ...")
      InvRecords = filemakerUserObject.response.data  
      // console.log({Inv})
  } catch (error) {
      console.error('Getting User Data Error:', error);
      alert('Failed to gather InvoiceRecords Records'); // Display custom alert message
      return false;
  }

  let InvRecordsJOIN
  layout = "dapi_InvRecord|JOIN|qb"

  try{
      //GET USER INFO
      const filemakerUserObject = await readRecord(config.NODE_TOKEN,{query},layout)
      if(filemakerUserObject.length===0){
          throw new Error("Error on getting InvoiceQbJoin info from FileMaker")
      }
      console.log("InvRecordsJOIN fetch successfull ...")
      InvRecordsJOIN = filemakerUserObject.response.data  
      // console.log({Inv})
  } catch (error) {
      console.error('Getting User Data Error:', error);
      alert('Failed to gather InvoiceRecords Records'); // Display custom alert message
      return false;
  }

  sessionStorage.setItem('fmData', JSON.stringify({Inv,InvRecords,InvRecordsJOIN}));

}

init()
