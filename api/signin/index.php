<?php
require_once "../Response.php";
require_once "../Request.php";


function getAuthenticationResponse($authenticationData): Response
{
    $request = new Request(
        url: 'https://www.expensify.com/api?command=Authenticate',
        headers: [
            "Content-Type: application/x-www-form-urlencoded",
        ],
    );
    $httpResponse = $request->post(
        body: [
            "partnerName" => getenv("PARTNER_NAME"),
            "partnerPassword" => getenv("PARTNER_PASSWORD"),
            "partnerUserID" => $authenticationData->email,
            "partnerUserSecret" => $authenticationData->password,
        ],
    );

    $decodedResponse = json_decode($httpResponse["response"]);

    if ($decodedResponse->jsonCode == 200) {
        if (setcookie("authToken", $decodedResponse->authToken, path: "/")) {
            return new Response(payload: $decodedResponse);
        }
    }

    $payload = $decodedResponse;
    if (in_array($decodedResponse->jsonCode, [401, 404])) {
        // The message returned by the API may not be clear to some users.
        $payload->message = "Invalid username/password.";
    }
    return new Response(status_code: $decodedResponse->jsonCode, payload: $payload);
}

try {
    if ($_SERVER['REQUEST_METHOD'] != 'POST') {
        $response = new Response(status_code: 405);
    } else {
        $response = getAuthenticationResponse(
            json_decode(file_get_contents("php://input"))
        );
    }
} catch (Exception $e) {
    $response = new Response(status_code: 500);
}
$response->send();
