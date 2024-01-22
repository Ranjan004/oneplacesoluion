let access_token;
let container = document.querySelector('.container');
let header = document.querySelector('.header');
let full = document.querySelector('.full');

function submitLoginForm() {
    container.classList.add('show')
    full.classList.add('hide')
    header.classList.add('show')
    const loginUrl = 'https://api.oneplacesolution.in/api/auth/signin';

    // Get values from the form
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const loginData = {
        email: email,
        password: password
    };

    // Fetch API to send login request
    fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Log the entire data object
            // console.log('API Response:', data);

            // Check if isAdmin exists in the data object
            if (data.data && data.data.hasOwnProperty('isAdmin')) {
                // If isAdmin is true, fetch user data
                if (data.data.isAdmin) {
                    // console.log('accessToken value:', data.access_token);
                    access_token = data.access_token;
                    sessionStorage.setItem('access_token', access_token);
                    console.log(access_token);

                    // Fetch user data using the access token
                    const userUrl = 'https://api.oneplacesolution.in/api/user';

                    // Set up headers with the access token
                    const userHeaders = new Headers();
                    userHeaders.append("Authorization", `Bearer ${access_token}`);

                    const userRequestOptions = {
                        method: 'GET',
                        headers: userHeaders,
                        redirect: 'follow'
                    };

                    // Fetch user data
                    fetch(userUrl, userRequestOptions)
                        .then(response => response.json())
                        .then(userData => {
                            // Display user data in the table
                            displayUserData(userData);
                        })
                        .catch(error => {
                            // Handle errors in user data request
                            console.error('Error fetching user data:', error);
                        });
                }
            } else {
                console.log('isAdmin field not found in the response');
            }
        })
        .catch(error => {
            // Handle errors
            console.error('Error during login:', error);
        });
}



function updateUserStatus(userId, selectedStatus) {
    const updateStatusUrl = `https://api.oneplacesolution.in/api/user/update/${userId}`;

    const updateStatusHeaders = new Headers();
    updateStatusHeaders.append("Content-Type", "application/json");
    updateStatusHeaders.append("Authorization", `Bearer ${access_token}`);

    const updateStatusOptions = {
        method: 'POST',
        headers: updateStatusHeaders,
        body: JSON.stringify({
            "status": selectedStatus
        }),
        redirect: 'follow'
    };

    fetch(updateStatusUrl, updateStatusOptions)
        .then(response => response.text())
        .then(result => {
            console.log('User Status Updated:', result);
            // Optionally, you can update the table again to reflect the updated status
            submitLoginForm();
        })
        .catch(error => console.error('Error updating user status:', error));
}

function deleteUser(userId) {
    const deleteStatusUrl = `https://api.oneplacesolution.in/api/user/delete/${userId}`;
    console.log(deleteStatusUrl);
    const deleteStatusHeaders = new Headers();
    deleteStatusHeaders.append("Content-Type", "application/json");
    deleteStatusHeaders.append("Authorization", `Bearer ${access_token}`);

    const deleteStatusOptions = {
        method: 'DELETE',
        headers: deleteStatusHeaders,
        redirect: 'follow'
    };

    fetch(deleteStatusUrl, deleteStatusOptions)
        .then(response => response.text())
        .then(result => {
            console.log('User Status Updated:', result);
            // Optionally, you can update the table again to reflect the updated user list
            submitLoginForm();
        })
        .catch(error => console.error('Error deleting user:', error));
}

// Function to display user data with dropdown options
function displayUserData(userData) {
    const tableBody = document.querySelector('#userDataTable tbody');
    tableBody.innerHTML = '';

    const modal = document.getElementById('myModal');
    const modalMessage = document.getElementById('modalMessage');

    if (userData.data && Array.isArray(userData.data) && userData.data.length > 0) {
        userData.data.forEach((user, index) => {
            const row = tableBody.insertRow();
            const userIdCell = row.insertCell(0);
            const emailCell = row.insertCell(1);
            const statusCell = row.insertCell(2);
            const actionCell = row.insertCell(3);

            userIdCell.textContent = index + 1;
            emailCell.textContent = user.email || '';
            statusCell.textContent = user.status || '';

            const dropdown = document.createElement('select');

            const optionSelect = document.createElement('option');
            optionSelect.value = 'Select';
            optionSelect.text = 'Select';
            dropdown.add(optionSelect);

            const optionUpdateApproved = document.createElement('option');
            optionUpdateApproved.value = 'APPROVED';
            optionUpdateApproved.text = 'Approved';
            if (user.status === 'APPROVED') {
                optionUpdateApproved.disabled = true;
            }
            dropdown.add(optionUpdateApproved);

            const optionUpdatePending = document.createElement('option');
            optionUpdatePending.value = 'PENDING';
            optionUpdatePending.text = 'Pending';
            if (user.status === 'PENDING') {
                optionUpdatePending.disabled = true;
            }
            dropdown.add(optionUpdatePending);

            const optionDelete = document.createElement('option');
            optionDelete.value = 'DELETE';
            optionDelete.text = 'Delete User';
            dropdown.add(optionDelete);

            const optionViewListings = document.createElement('option');
            optionViewListings.value = 'VIEW_LISTINGS';
            optionViewListings.text = 'View Listings';
            dropdown.add(optionViewListings);

            dropdown.addEventListener('change', function() {
                const selectedStatus = this.value;
                if (selectedStatus === 'APPROVED' || selectedStatus === 'PENDING') {
                    updateUserStatus(user._id, selectedStatus);
                    showModal(`User ${user.email} status updated to ${selectedStatus}`);
                } else if (selectedStatus === 'DELETE') {
                    deleteUser(user._id);
                    showModal(`User ${user.email} deleted`);
                } else if (selectedStatus === 'VIEW_LISTINGS') {
                    // Call the API to view listings
                    viewListings(user._id);
                } else {
                    showModal('Please select a valid action.');
                }
            });

            actionCell.appendChild(dropdown);

            // Highlight the row if the status is 'PENDING'
            if (user.status === 'PENDING') {
                row.classList.add('highlight-pending');
            }
        });
    } else {
        console.log('No User Data Found');
    }

    // Function to show the modal
    function showModal(message) {
        modalMessage.textContent = message;
        modal.style.display = 'block';
    }

    setTimeout(function() {
        modal.style.display = 'none';
    }, 1500);
}




function signOut() {
    // Make the API call to sign out
    fetch('https://api.oneplacesolution.in/api/auth/signout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            alert('Sign Out Successful:', data);
        })
        .catch(error => {
            console.error('Sign Out Error:', error);
        });
}

document.getElementById('logoutLink').addEventListener('click', function(event) {
    event.preventDefault();
    signOut();
    location.reload();
});


function viewListings(userId) {
    const viewListingsUrl = `https://api.oneplacesolution.in/api/user/listings/${userId}`;

    const viewListingsHeaders = new Headers();
    viewListingsHeaders.append("Authorization", `Bearer ${access_token}`);

    const viewListingsOptions = {
        method: 'GET',
        headers: viewListingsHeaders,
        redirect: 'follow'
    };

    fetch(viewListingsUrl, viewListingsOptions)
        .then(response => response.json())
        .then(listingsData => {
            // Save the listings data to sessionStorage for access in the new page
            sessionStorage.setItem('listingsData', JSON.stringify(listingsData));

            window.open(
                'all-data.html',
                '_blank' // <- This is what makes it open in a new window.
            );
            // window.open('new-page.html')
        })
        .catch(error => {
            console.error('Error fetching listings data:', error);
        });
}
