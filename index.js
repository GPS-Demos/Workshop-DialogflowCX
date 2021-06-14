/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */


const {Client} = require("@googlemaps/google-maps-services-js");

const client = new Client({});
const apiKey =  "API_KEY"

 
const placeName = "Department of Motor Vehicle" 


async function getNearestPlace(zipCode, placeName) {
    console.log(">>> place and zip", placeName, zipCode)

    const geocodeParams = {
        address: zipCode,
        components: { country: "us" }, 
        key: apiKey  
      };
      
    const searchParams = {
        input: placeName,
        inputtype: "textquery",
        key: apiKey,
        fields: ["place_id", "name", "formatted_address"] 
    };

    response = {address: null, name: null }

    try{ 
        // get latidude longitude from zipcode using geocodig api
        const geoCodeResults = await client.geocode({ params: geocodeParams }) 

        // set location bias to latlng results from geocoding
        const lat = geoCodeResults.data.results[0].geometry.location.lat
        const lng = geoCodeResults.data.results[0].geometry.location.lng
        searchParams.locationbias = "point: " + lat + "," + lng   
    

        // use findPlaceFromText api to find place name
        const findFromTextResults = await client.findPlaceFromText({ params: searchParams })
        const closest_dmv_address = findFromTextResults.data.candidates[0].formatted_address 
        const closest_dmv_name = findFromTextResults.data.candidates[0].name 

        console.log("The closest DMV office is ", closest_dmv_name, ". It is located at ", closest_dmv_address);
        response =  {address: closest_dmv_address, name: closest_dmv_name}
    } catch(e) {
        console.log(">>> An error occurred", JSON.stringify(e))
    }

    return response
}
 
exports.getDMVLocation = (req, res) => {
  zipCode = req.body.sessionInfo.parameters.zip_code[0];
  let responseMessage = ""
  let dmv_location_status = false

  // Call get nearest location function above. It returns a promise.
  getNearestPlace(zipCode, placeName).then((nearestLocation) => { 
    if (nearestLocation.name)  {
        responseMessage = "The closest DMV office is " + nearestLocation.name + ". It is located at " + nearestLocation.address + ". Is there anything else I can help you with?"
        dmv_location_status = true
    }else{
        responseMessage = "The zip code " + zipCode + " is not valid. Please enter a valid zip code."
    }
    
    res.status(200).send({
                    sessionInfo: {
                        parameters: {
                        nearest_dmv_name: nearestLocation.name,
                        nearest_dmv_address: nearestLocation.address,
                        dmv_location_status: dmv_location_status
                        }
                    },
                    fulfillmentResponse: {
                        messages: [
                            {
                                text: {
                                    text: [
                                        responseMessage
                                    ]
                                }
                            }
                        ]
                    }
                });
  })
  
};
