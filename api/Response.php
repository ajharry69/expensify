<?php


class Response
{
    private int $status_code;
    private $payload;
    private $headers;

    public function __construct(int $status_code = 200, $payload = null, $headers = null)
    {
        $this->status_code = $status_code;
        $this->payload = $payload;
        $this->headers = $headers;
    }

    private function getJson(): string
    {
        $response = $this->payload ?? [];
        return json_encode($response);
    }

    public function __toString(): string
    {
        return $this->getJson();
    }

    public function send(): void
    {
        http_response_code($this->status_code);
        header("Content-Type: application/json; charset=UTF-8");
        if (is_array($this->headers)) {
            foreach ($this->headers as $header) {
                header($header);
            }
        }
        if ($this->status_code != 204) {
            print($this->getJson());
        }
    }
}