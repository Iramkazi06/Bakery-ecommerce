// This file contains functions related to the checkout process, including handling payment methods and validating user input.

document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const progressBar = document.getElementById('progress-bar');
    let currentStep = 0;

    // Function to handle form submission
    checkoutForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (validateForm()) {
            proceedToPayment();
        }
    });

    // Function to validate the checkout form
    function validateForm() {
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;

        if (!name || !address || !city || !zip) {
            alert('Please fill in all fields.');
            return false;
        }
        return true;
    }

    // Function to proceed to payment
    function proceedToPayment() {
        currentStep++;
        updateProgressBar();
        // Here you can add logic to show payment options
        alert('Proceeding to payment step.');
    }

    // Function to update the progress bar
    function updateProgressBar() {
        const steps = paymentMethods.length;
        const progressPercentage = (currentStep / steps) * 100;
        progressBar.style.width = progressPercentage + '%';
    }

    // Event listener for payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            // Logic to handle payment method selection
            alert(`Selected payment method: ${this.value}`);
        });
    });
});