<?php

class Request
{
    private string $url;
    private array $headers;

    function __construct(string $url, array $headers = array())
    {
        $this->url = $url;
        $this->headers = $headers;
    }

    public function get(): array
    {
        return $this->send('GET');
    }

    public function post($body = null): array
    {
        return $this->send('POST', $body);
    }

    private function send(string $method, $body = null): array
    {
        $curl = curl_init($this->url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

        curl_setopt($curl, CURLOPT_HTTPHEADER, $this->headers);

        if ($method !== 'GET') curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);

        if ($body) curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($body));

        $response = curl_exec($curl);
        $error = curl_error($curl);

        curl_close($curl);

        return ["response" => $response, "error" => $error];
    }
}
