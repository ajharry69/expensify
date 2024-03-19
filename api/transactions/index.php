<?php
require_once "../Response.php";
require_once "../Request.php";


function invalidateExpiredAuthenticationCookie($responseCode): void
{
    if ($responseCode == 407) {
        // Remove expired authentication cookie. The user will be asked to reauthenticate

        // There's no direct way to delete a cookie in PHP using a dedicated function.
        // However, you can achieve this by setting the cookie's expiration time to a past date
        setcookie(
            "authToken",
            expires_or_options: time() - (60 * 60 * 24),
            path: "/",
        );
    }
}

function getTransactionsPayload($decodedResponse, $start, $limit)
{
    if ($decodedResponse->jsonCode != 200) return $decodedResponse;

    $transactionList = $decodedResponse->transactionList;
    if ($limit == null || $limit == '') return $transactionList;

    return array_slice($transactionList, $start, $limit);
}

function getTransactionsResponse($authToken): Response
{
    if (is_null($authToken)) return new Response(401);

    $startDate = $_GET["startDate"] ?? "";
    $endDate = $_GET["endDate"] ?? "";
    $url = "https://www.expensify.com/api?command=Get&returnValueList=transactionList&authToken={$authToken}&startDate={$startDate}&endDate={$endDate}";
    $request = new Request(url: $url);
    $httpResponse = $request->get();
    $decodedResponse = json_decode($httpResponse["response"]);
    invalidateExpiredAuthenticationCookie($decodedResponse->jsonCode);

    $transactionsPayload = getTransactionsPayload(
        $decodedResponse,
        start: $_GET["start"] ?? 0,
        limit: $_GET["limit"] ?? null,
    );
    return new Response(
        status_code: $decodedResponse->jsonCode,
        payload: $transactionsPayload,
    );
}

function createTransactionResponse($transactionData, $authToken): Response
{
    if (is_null($authToken)) return new Response(401);

    $request = new Request(url: 'https://www.expensify.com/api?command=CreateTransaction');

    $httpResponse = $request->post(
        body: [
            "created" => $transactionData->date,
            "amount" => $transactionData->amount,
            "merchant" => $transactionData->merchant,
            "authToken" => $authToken,
        ],
    );

    $decodedResponse = json_decode($httpResponse["response"]);
    invalidateExpiredAuthenticationCookie($decodedResponse->jsonCode);
    return new Response($decodedResponse->jsonCode, $decodedResponse);
}

try {
    $authToken = $_COOKIE["authToken"] ?? $_GET["authToken"] ?? null;
    $response = match ($_SERVER['REQUEST_METHOD']) {
        'GET' => getTransactionsResponse($authToken),
        'POST' => createTransactionResponse(
            json_decode(file_get_contents("php://input")),
            $authToken,
        ),
        default => new Response(405),
    };
} catch (Exception $e) {
    $response = new Response(status_code: 500);
}
$response->send();
