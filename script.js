"use-strict";

$(() => {
    function showTransactionsTable() {
        $("#loginContent").addClass("d-none");
        $("#transactionFormContainer").addClass("d-none");
        $("#transactionTable").removeClass("d-none");
    }

    function showLoginForm() {
        $("#loginContent").removeClass("d-none");
        $("#transactionFormContainer").addClass("d-none");
        $("#transactionTable").addClass("d-none");
    }

    function showTransactionForm() {
        $("#loginContent").addClass("d-none");
        $("#transactionFormContainer").removeClass("d-none");
        $("#transactionTable").addClass("d-none");
    }

    function populateTable(data) {
        const dataTable = $("#transactionTable tbody");
        dataTable.empty(); // Clear existing rows before populating

        $.each(data, function (index, record) {
            const tableRow = $("<tr></tr>");
            tableRow.append(`<td>${record.transactionID}</td>`);
            tableRow.append(`<td>${record.created}</td>`);
            tableRow.append(`<td>${record.merchant ?? "-"}</td>`);
            tableRow.append(`<td>${record.amount}</td>`);
            tableRow.append(`<td>${record.currency}</td>`);
            tableRow.append(`<td>${record.billable ? "✔" : "❌"}</td>`);

            dataTable.append(tableRow);
        });
    }

    let chunkSize = 20;
    let startIndex = 0;
    const loadPreviousTransactionsButton = $("#loadPreviousTransactionsButton");
    const originalPreviousTransactionsButtonText = loadPreviousTransactionsButton.text();
    loadPreviousTransactionsButton.click(() => {
        if (startIndex > 0) {
            // Start index should not be below 0, since transaction list lookup is zero-index
            startIndex -= chunkSize;
        }
        fetchAndPopulateTransactionsTable(false);
    });

    const loadNextTransactionsButton = $("#loadNextTransactionsButton");
    const originalNextTransactionsButtonText = loadNextTransactionsButton.text();
    loadNextTransactionsButton.click(() => {
        startIndex += chunkSize;
        fetchAndPopulateTransactionsTable(true);
    });

    function resetPreviousAndNextButtonStates(shouldLoadNextTransactions, dataSize) {
        if (shouldLoadNextTransactions === true) {
            loadNextTransactionsButton.attr('disabled', false);
            loadNextTransactionsButton.html(originalNextTransactionsButtonText);
        } else if (shouldLoadNextTransactions === false) {
            loadPreviousTransactionsButton.attr('disabled', false);
            loadPreviousTransactionsButton.html(originalPreviousTransactionsButtonText);
        }

        loadPreviousTransactionsButton.attr('disabled', true);
        if (startIndex > 0) {
            loadPreviousTransactionsButton.attr('disabled', false);
        }

        if (dataSize === chunkSize) {
            // Enable button when more data may be available
            loadNextTransactionsButton.attr('disabled', false);
        } else {
            // Disable button when the end is reached
            loadNextTransactionsButton.attr('disabled', true);
        }
    }

    function requestAuthenticationIfNecessary(jqXHR) {
        const unAuthorizedRequestStatusCodes = [401, 407];
        if (unAuthorizedRequestStatusCodes.includes(jqXHR.status)) {
            showLoginForm();
        }
    }

    function fetchAndPopulateTransactionsTable(shouldLoadNextTransactions = null) {
        if (shouldLoadNextTransactions === true) {
            loadNextTransactionsButton.attr('disabled', true);
            loadNextTransactionsButton.html("Loading...");
        } else if (shouldLoadNextTransactions === false) {
            loadPreviousTransactionsButton.attr('disabled', true);
            loadPreviousTransactionsButton.html("Loading...");
        }
        $.ajax('/api/transactions/', {
            dataType: "json",
            data: {start: startIndex, limit: chunkSize},
            success: (data, textStatus, jqXHR) => {
                populateTable(data);
                resetPreviousAndNextButtonStates(shouldLoadNextTransactions, data.length);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                resetPreviousAndNextButtonStates(shouldLoadNextTransactions, chunkSize);
                requestAuthenticationIfNecessary(jqXHR);
            },
        });
    }

    function showTransactionsTableWithTransactions() {
        showTransactionsTable();
        fetchAndPopulateTransactionsTable();
    }

    function formDataToJson(formData) {
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    function executeHttpRequestWithFormStateManagement(form, url, jsonStringifyRequestData, onSuccess, onError = null) {
        const loadingStateText = form.data("loading");

        const submitButton = form.find("button[type='submit']");
        const originalSubmitButtonText = submitButton.text();

        function restoreButtonState() {
            submitButton.html(originalSubmitButtonText);
            submitButton.attr('disabled', false);
        }

        submitButton.html(loadingStateText);
        submitButton.attr('disabled', true);

        const formData = new FormData(form[0]);
        const data = formDataToJson(formData);

        let requestData = data,
            processData = true,
            contextType = false;
        if (jsonStringifyRequestData) {
            requestData = JSON.stringify(data);
            processData = false;
            contextType = "application/json";
        }

        $.ajax(url, {
            method: form.prop('method') ?? "GET",
            data: requestData,
            processData: processData,
            contentType: contextType,
            success: (data, textStatus, jqXHR) => {
                restoreButtonState();
                form[0].reset();
                if (jqXHR.status === 200) {
                    onSuccess(data);
                    form.find(".error").addClass("d-none");
                    form.find(".error").html("");
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                restoreButtonState();
                let error;
                try {
                    const response = JSON.parse(jqXHR.responseText);
                    error = response.message;
                } catch (e) {
                    error = "Sorry, something went wrong. Please try again.";
                }

                form.find(".error").removeClass("d-none");
                form.find(".error").html(error);

                if (onError !== null) {
                    onError(jqXHR);
                }
            },
        });
    }

    if (document.cookie.indexOf('authToken=') !== -1) {
        // User is signed in
        showTransactionsTableWithTransactions();
    } else {
        // User not signed in
        showLoginForm();
    }

    $("#loginForm").on('submit', function (event) {
        event.preventDefault();

        const form = $(this);

        executeHttpRequestWithFormStateManagement(
            form,
            '/api/signin/',
            true,
            (_) => showTransactionsTableWithTransactions(),
        );
    });

    $("#transactionFormContainer form").on('submit', function (event) {
        event.preventDefault();

        const form = $(this);

        executeHttpRequestWithFormStateManagement(
            form,
            '/api/transactions/',
            true,
            (_) => showTransactionsTableWithTransactions(),
        );
    });

    $("#transactionsFilterForm").on('submit', function (event) {
        event.preventDefault();

        const form = $(this);

        executeHttpRequestWithFormStateManagement(
            form,
            '/api/transactions/',
            false,
            (data) => populateTable(data),
            (jqXHR) => requestAuthenticationIfNecessary(jqXHR),
        );
    });

    $("#createTransactionButton").click(() => {
        showTransactionForm();
    });

    $("#transactionForm button[type='button']").click(() => {
        showTransactionsTable();
        $("#transactionForm")[0].reset();
    });

    $("#paginateCheckbox").change(function () {
        if (this.checked) {
            chunkSize = 20;
            $(".transactions-pagination-buttons").removeClass("d-none");
        } else {
            chunkSize = null;
            $(".transactions-pagination-buttons").addClass("d-none");
        }

        fetchAndPopulateTransactionsTable();
    });
});
