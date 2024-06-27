/*
USEAGE EXAMPLE
        query = [
            {"__ID": filemakerId}
        ];
        
        try{
            //GET USER INFO
            const filemakerUserObject = await readRecord(authState.token,{query},userLayout)
            if(filemakerUserObject.length===0){
                throw new Error("Error on getting user info from FileMaker")
            }
            console.log("user fetch successfull ...")
            const userObject = filemakerUserObject.response.data  
        } catch (error) {
            console.error('Getting User Data Error:', error);
            setAuthState(prevState => ({
                ...prevState,
                errorMessage: error.message,
            }));
            return false;
        }
*/

async function readRecord(token, params, layout) {
    console.log("FileMaker Read called")
    // Prepare the data for the API call
    const payloadData = {
        method: "findRecord",
        server: "server.selectjanitorial.com",
        database: "clarityData",
        layout,
        params
    };

    try {
        const response = await fetch('https://server.claritybusinesssolutions.ca:4343/clarityData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payloadData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        // Check if the response indicates success
        if (responseData.messages && responseData.messages[0].code === "0") {
            return responseData
        } else {
            throw new Error(`Failed to create record: ${responseData.messages[0].message}`);
        }


    } catch (error) {
        console.log("Find unsuccessfull");
        console.error("Error creating account: ", error.message);
        throw error; // Rethrow the error to be handled by the caller
    }
}

export { readRecord };
