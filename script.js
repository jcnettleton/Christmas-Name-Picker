document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startSetupBtn = document.getElementById('startSetupBtn');
    const modal = document.getElementById('setupModal');
    const closeButton = document.querySelector('.close-button');
    const resultsArea = document.getElementById('resultsArea');
    const assignmentList = document.getElementById('assignmentList');
    const errorMessage = document.getElementById('errorMessage');
    const reshuffleBtn = document.getElementById('reshuffleBtn'); // Get the new button

    // Modal Steps
    const modalSteps = {
        step1: document.getElementById('modalStep1'),
        step2: document.getElementById('modalStep2'),
        step3: document.getElementById('modalStep3'),
        step4: document.getElementById('modalStep4'),
    };

    // Modal Buttons
    const nextToNamesBtn = document.getElementById('nextToNamesBtn');
    const backToSizeBtn = document.getElementById('backToSizeBtn');
    const nextToSpousesBtn = document.getElementById('nextToSpousesBtn');
    const backToNamesBtn = document.getElementById('backToNamesBtn');
    const nextToLastYearBtn = document.getElementById('nextToLastYearBtn');
    const backToSpousesBtn = document.getElementById('backToSpousesBtn');
    const skipLastYearBtn = document.getElementById('skipLastYearBtn');
    const generateBtn = document.getElementById('generateBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');


    // Modal Input Containers
    const familySizeInput = document.getElementById('familySize');
    const nameInputsContainer = document.getElementById('nameInputsContainer');
    const spouseInputsContainer = document.getElementById('spouseInputsContainer');
    const lastYearInputsContainer = document.getElementById('lastYearInputsContainer');

    // --- State ---
    let familyData = []; // Array of objects: { id: uniqueId, name: '', spouseId: null, lastAssignedId: null }

    // --- Utility Functions ---
    function showModal() {
        modal.style.display = 'block';
        goToStep('step1'); // Start at step 1
        // Reset family data when opening modal for a fresh setup
        // Keep existing data if you want to edit, but for now, let's reset
        familySizeInput.value = 3; // Reset to default
        familyData = [];
        // Hide results when opening modal again
        resultsArea.style.display = 'none';
        reshuffleBtn.style.display = 'none';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function goToStep(stepName) {
        Object.values(modalSteps).forEach(step => step.style.display = 'none');
        if (modalSteps[stepName]) {
            modalSteps[stepName].style.display = 'block';
        }
        // Scroll modal to top
        modal.querySelector('.modal-content').scrollTop = 0;
    }

    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // --- Step Generation Functions ---

    function generateNameInputs(count) {
        nameInputsContainer.innerHTML = ''; // Clear previous
        // Ensure we have at least 'count' members in familyData, preserving existing if possible
        while (familyData.length < count) {
            familyData.push({ id: generateUniqueId(), name: '', spouseId: null, lastAssignedId: null });
        }
        // Trim excess if count decreased
        familyData = familyData.slice(0, count);

        familyData.forEach((member, index) => {
            addNameInputRow(member, index);
        });
        updateFamilySizeInput(); // Sync input field with actual count
    }

    function addNameInputRow(member, index) {
         const div = document.createElement('div');
         div.classList.add('input-group');
         div.dataset.memberId = member.id; // Store id on the element

         const label = document.createElement('label');
         label.htmlFor = `name-${member.id}`;
         label.textContent = `Person ${index + 1}:`;

         const input = document.createElement('input');
         input.type = 'text';
         input.id = `name-${member.id}`;
         input.placeholder = 'Enter name';
         input.value = member.name; // Pre-fill if exists
         input.addEventListener('change', (e) => {
             const targetMember = familyData.find(m => m.id === member.id);
             if (targetMember) targetMember.name = e.target.value.trim();
         });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕'; // or '-' or 'Remove'
        removeBtn.classList.add('remove-member-btn');
        removeBtn.title = "Remove this person";
        removeBtn.type = 'button'; // Prevent form submission if it were inside a form
        removeBtn.addEventListener('click', () => {
            removeMember(member.id);
        });

         div.appendChild(label);
         div.appendChild(input);
         div.appendChild(removeBtn);
         nameInputsContainer.appendChild(div);
    }

    function removeMember(memberIdToRemove) {
        // Find the member object to get the spouseId before removing
        const memberToRemove = familyData.find(member => member.id === memberIdToRemove);
        const spouseId = memberToRemove ? memberToRemove.spouseId : null;

        // Remove the member
        familyData = familyData.filter(member => member.id !== memberIdToRemove);

        // If the removed member had a spouse, un-link the spouse
        if (spouseId) {
            const spouse = familyData.find(member => member.id === spouseId);
            if (spouse && spouse.spouseId === memberIdToRemove) {
                spouse.spouseId = null;
            }
        }
        // Also make sure no one has the removed member as their last assigned
         familyData.forEach(member => {
             if (member.lastAssignedId === memberIdToRemove) {
                 member.lastAssignedId = null;
             }
         });


        // Re-render name inputs based on the updated familyData
        const currentCount = familyData.length;
        familySizeInput.value = currentCount; // Update the count input
        generateNameInputs(currentCount); // Regenerate the name input section
    }

    function updateFamilySizeInput() {
        familySizeInput.value = familyData.length;
    }

    function generateSpouseInputs() {
        spouseInputsContainer.innerHTML = ''; // Clear previous
        const validMembers = familyData.filter(m => m.name.trim() !== '');

        if (validMembers.length < 1) {
             spouseInputsContainer.innerHTML = '<p>Please enter at least one name first.</p>';
             return;
        }

        validMembers.forEach(member => {
            const div = document.createElement('div');
            div.classList.add('input-group');

            const label = document.createElement('label');
            label.htmlFor = `spouse-${member.id}`;
            label.textContent = `${member.name}:`;

            const select = document.createElement('select');
            select.id = `spouse-${member.id}`;
            select.innerHTML = '<option value="">-- None --</option>'; // Default null option

            validMembers.forEach(potentialSpouse => {
                if (potentialSpouse.id !== member.id) { // Can't be own spouse
                    const option = document.createElement('option');
                    option.value = potentialSpouse.id;
                    option.textContent = potentialSpouse.name;
                    if (member.spouseId === potentialSpouse.id) {
                        option.selected = true; // Pre-select if already set
                    }
                    select.appendChild(option);
                }
            });

            select.addEventListener('change', (e) => {
                 const currentMember = familyData.find(m => m.id === member.id); // Ensure we modify the array item
                 if (!currentMember) return;

                 const previousSpouseId = currentMember.spouseId;
                 const selectedSpouseId = e.target.value || null; // Get ID or null if '-- None --'

                 // --- Two-way linking logic ---
                 // 1. Update the current member's spouseId
                 currentMember.spouseId = selectedSpouseId;

                 // 2. If a new spouse was selected, update the new spouse's link back
                 if (selectedSpouseId) {
                     const newSpouseMember = familyData.find(m => m.id === selectedSpouseId);
                     if (newSpouseMember) {
                         // Link back only if the new spouse is not already linked elsewhere, or is linked to the current member
                         if (!newSpouseMember.spouseId || newSpouseMember.spouseId === currentMember.id) {
                             newSpouseMember.spouseId = currentMember.id;
                             // Refresh the other select element in the UI
                             const otherSelect = document.getElementById(`spouse-${newSpouseMember.id}`);
                             if (otherSelect) otherSelect.value = currentMember.id;
                         } else {
                             // Optional: Alert if the selected spouse is already paired differently
                              // alert(`${newSpouseMember.name} is already paired with someone else. This pairing is one-way for now.`);
                             // You might choose to automatically break the other link, but that can be confusing.
                         }
                     }
                 }

                 // 3. If a spouse was *unselected* (or changed), break the link from the *previous* spouse
                 if (previousSpouseId && previousSpouseId !== selectedSpouseId) {
                     const previousSpouseMember = familyData.find(m => m.id === previousSpouseId);
                     // Only break the link if the previous spouse was indeed linked back to the current member
                     if (previousSpouseMember && previousSpouseMember.spouseId === currentMember.id) {
                         previousSpouseMember.spouseId = null;
                         // Refresh the other select element in the UI
                         const otherSelect = document.getElementById(`spouse-${previousSpouseMember.id}`);
                         if (otherSelect) otherSelect.value = ""; // Set to '-- None --'
                     }
                 }

            });

            div.appendChild(label);
            div.appendChild(select);
            spouseInputsContainer.appendChild(div);
        });
    }

     function generateLastYearInputs() {
        lastYearInputsContainer.innerHTML = ''; // Clear previous
        const validMembers = familyData.filter(m => m.name.trim() !== '');

        if (validMembers.length < 1) {
             lastYearInputsContainer.innerHTML = '<p>Please enter at least one name first.</p>';
             return;
        }

        validMembers.forEach(member => {
            const div = document.createElement('div');
             div.classList.add('input-group');

            const label = document.createElement('label');
            label.htmlFor = `lastYear-${member.id}`;
            label.textContent = `${member.name} gave to:`;

            const select = document.createElement('select');
            select.id = `lastYear-${member.id}`;
            select.innerHTML = '<option value="">-- None / Unknown --</option>'; // Default null option

            validMembers.forEach(potentialRecipient => {
                // Can't have given to self
                if (potentialRecipient.id !== member.id) {
                    const option = document.createElement('option');
                    option.value = potentialRecipient.id;
                    option.textContent = potentialRecipient.name;
                    if (member.lastAssignedId === potentialRecipient.id) {
                        option.selected = true; // Pre-select
                    }
                    select.appendChild(option);
                }
            });

            select.addEventListener('change', (e) => {
                // Find member in the main array and update
                const targetMember = familyData.find(m => m.id === member.id);
                if(targetMember) targetMember.lastAssignedId = e.target.value || null;
            });

            div.appendChild(label);
            div.appendChild(select);
            lastYearInputsContainer.appendChild(div);
        });
    }

    // --- Core Assignment Logic ---

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    function findGiftExchangeAssignments(members) {
        if (members.length < 2) {
            console.error("Cannot generate assignments with fewer than 2 members.");
            return null;
        }

        const maxAttempts = 5000;
        const memberIds = members.map(m => m.id);
        const memberMap = new Map(members.map(m => [m.id, m])); // Map ID to member object for easy lookup

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            shuffleArray(memberIds); // Shuffle the order of givers for randomness

            const assignments = {}; // giverId -> recipientId
            const recipientsTaken = new Set();
            let possible = true;

            for (const giverId of memberIds) {
                const giver = memberMap.get(giverId);
                const potentialRecipients = memberIds.filter(recipientId => {
                    const recipient = memberMap.get(recipientId); // Get recipient object
                    // Constraints:
                    return recipientId !== giverId && // Not self
                           recipientId !== giver.spouseId && // Not spouse
                           recipientId !== giver.lastAssignedId && // Not last year's recipient
                           !recipientsTaken.has(recipientId); // Not already assigned to someone else this round
                });

                if (potentialRecipients.length === 0) {
                    possible = false; // Dead end found for this giver
                    break; // Break inner loop and try a new random order (next attempt)
                }

                // Choose a random valid recipient
                shuffleArray(potentialRecipients);
                const recipientId = potentialRecipients[0];
                assignments[giverId] = recipientId;
                recipientsTaken.add(recipientId);
            }

            if (possible) {
                 // Verify everyone got assigned
                 if(Object.keys(assignments).length === members.length && recipientsTaken.size === members.length) {
                    return assignments; // Success!
                 } else {
                     console.warn(`Attempt ${attempt}: Assignment logic error: possible=true but assignment incomplete.`, assignments, recipientsTaken);
                     // Continue to next attempt
                 }
            }
            // If not possible, the outer loop continues to the next attempt
        }

        console.error(`Failed to find a valid assignment after ${maxAttempts} attempts.`);
        return null; // Failed to find a solution
    }


    function displayResults(assignments) {
        assignmentList.innerHTML = ''; // Clear previous results
        errorMessage.textContent = ''; // Clear previous errors
        resultsArea.style.display = 'block'; // Show results area (needed for error message too)

        const validMembers = familyData.filter(m => m.name.trim() !== '');
        const memberMap = new Map(validMembers.map(m => [m.id, m.name])); // Map ID to Name

        if (assignments) {
            for (const [giverId, recipientId] of Object.entries(assignments)) {
                const giverName = memberMap.get(giverId) || 'Unknown Giver';
                const recipientName = memberMap.get(recipientId) || 'Unknown Recipient';

                const li = document.createElement('li');
                li.textContent = `${giverName} gives a gift to ${recipientName} ${randomEmojiPicker()}`;
                assignmentList.appendChild(li);
            }
             reshuffleBtn.style.display = 'block'; // Show reshuffle button on success
             errorMessage.textContent = ''; // Clear any previous error
        } else {
             errorMessage.textContent = 'Could not find a valid assignment combination with the given constraints. Try removing the "last year" constraint or check spouse pairings.';
             reshuffleBtn.style.display = 'none'; // Hide reshuffle button on failure
             assignmentList.innerHTML = ''; // Clear any potentially stale list items
        }
    }

    function randomEmojiPicker() {
        const emojiList = [
            "🎄", "🎅", "🤶", "🧑‍🎄", "🦌", "🎁", "🎀", "🌟", "✨", "❄️",
            "☃️", "⛄", "🕯️", "🔔", "🧦", "🔥", "🪵", "🧤", "🧣", "🧥",
            "🍪", "🥛", "🍷", "🥂", "🍾", "🥧", "🍊", "🎆", "🎇", "🎉",
            "🎊", "🎈", "🥳", "🎂", "🍰", "🧁", "🍕", "🍔", "🍟", "🍿",
            "🍩", "🍫", "🍬", "🍭", "🍺", "🍻", "🍸", "🍹", "🍽️", "🧊",
            "🎶", "🎵", "🎤", "🎧", "🎷", "🎺", "🎸", "🥁", "🎹", "🎻",
            "💃", "🕺", "🧑‍🎤", "😊", "😄", "🤩", "😍",
            "🥰", "🤗", "😂", "👍", "🙌", "👏", "🙏", "💖", "❤️", "🧡",
            "💛", "💚", "💙", "💜", "⭐", "💫", "💯", "🕰️", "🕛", "💡",
            "🏆", "🥇"
          ]
          
        return emojiList[Math.floor(Math.random() * emojiList.length)]
    }

    // --- Action Trigger Function ---
    function performGeneration() {
        // Use the existing global 'familyData' which was set up via the modal
        const finalFamilyData = familyData.filter(m => m.name.trim() !== '');

        if (finalFamilyData.length < 2) {
            errorMessage.textContent = "Not enough named participants to generate assignments.";
            resultsArea.style.display = 'block';
            reshuffleBtn.style.display = 'none';
            assignmentList.innerHTML = '';
            return;
        }

        console.log("Generating/Reshuffling with data:", finalFamilyData); // For debugging
        const assignments = findGiftExchangeAssignments(finalFamilyData);
        displayResults(assignments);
    }


    // --- Event Listeners ---
    startSetupBtn.addEventListener('click', showModal);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { // Close modal if clicking outside
        if (event.target === modal) {
            closeModal();
        }
    });

    // --- Modal Navigation & Final Generation ---
    nextToNamesBtn.addEventListener('click', () => {
        // Preserve existing names if possible when changing count
        const currentNames = familyData.map(m => m.name);
        const count = parseInt(familySizeInput.value, 10);

        if (count >= 2) {
            // Rebuild familyData array, preserving old data where possible
            const newFamilyData = [];
            for(let i = 0; i < count; i++) {
                if (familyData[i]) {
                    // Keep existing member data if index exists
                    newFamilyData.push(familyData[i]);
                } else {
                    // Add new blank member data
                    newFamilyData.push({ id: generateUniqueId(), name: '', spouseId: null, lastAssignedId: null });
                }
            }
            familyData = newFamilyData; // Update global state

            generateNameInputs(count); // Regenerate inputs based on new familyData array
            goToStep('step2');
        } else {
            alert('Please enter at least 2 participants.');
        }
    });

     addMemberBtn.addEventListener('click', () => {
        const newMember = { id: generateUniqueId(), name: '', spouseId: null, lastAssignedId: null };
        familyData.push(newMember);
        addNameInputRow(newMember, familyData.length - 1); // Add row for the new member
        updateFamilySizeInput(); // Update the count display
     });

    backToSizeBtn.addEventListener('click', () => goToStep('step1'));

    nextToSpousesBtn.addEventListener('click', () => {
        // Update names from inputs before proceeding
        nameInputsContainer.querySelectorAll('.input-group').forEach(group => {
             const memberId = group.dataset.memberId;
             const input = group.querySelector('input[type="text"]');
             const member = familyData.find(m => m.id === memberId);
             if(member && input) member.name = input.value.trim();
        });

         // Filter out unnamed members *before* generating spouse inputs
         const namedMembers = familyData.filter(m => m.name.trim() !== '');
         if (namedMembers.length < 2) {
             alert("You need at least two named participants to define spouses.");
             return;
         }
         // Update the main familyData to only include named members from this point onwards in the setup flow?
         // Decided against this - keep potentially empty slots, filter at generation time.

        generateSpouseInputs();
        goToStep('step3');
    });

    backToNamesBtn.addEventListener('click', () => {
        // No data update needed here, just navigate back
        // Regenerate names to reflect current state (in case names were changed)
        const currentCount = familyData.length;
        generateNameInputs(currentCount);
        goToStep('step2');
    });

    nextToLastYearBtn.addEventListener('click', () => {
        // Update familyData with selected spouses before proceeding
         spouseInputsContainer.querySelectorAll('select').forEach(select => {
            const memberId = select.id.replace('spouse-', '');
            const member = familyData.find(m => m.id === memberId);
            // Spouse linking logic is handled in the 'change' event,
            // but we could re-capture here just in case.
             if(member) member.spouseId = select.value || null;
         });
         // Ensure spouse links are two-way before proceeding
         // This can be complex, the change handler is usually sufficient.

        generateLastYearInputs();
        goToStep('step4');
    });

     skipLastYearBtn.addEventListener('click', () => {
         // Ensure spouse data is captured from step 3 selects first
         spouseInputsContainer.querySelectorAll('select').forEach(select => {
            const memberId = select.id.replace('spouse-', '');
            const member = familyData.find(m => m.id === memberId);
             if(member) member.spouseId = select.value || null;
         });
         // Set all lastAssignedId to null explicitly
         familyData.forEach(member => member.lastAssignedId = null);

         performGeneration(); // Use the common generation function
         closeModal();
     });

    backToSpousesBtn.addEventListener('click', () => {
        // Update last year data before going back
         lastYearInputsContainer.querySelectorAll('select').forEach(select => {
             const memberId = select.id.replace('lastYear-', '');
             const member = familyData.find(m => m.id === memberId);
             if(member) member.lastAssignedId = select.value || null;
         });
        generateSpouseInputs(); // Regenerate spouse inputs with current data
        goToStep('step3');
    });

    generateBtn.addEventListener('click', () => {
        // Final data capture from the last step's inputs
         lastYearInputsContainer.querySelectorAll('select').forEach(select => {
             const memberId = select.id.replace('lastYear-', '');
             const member = familyData.find(m => m.id === memberId);
             if(member) member.lastAssignedId = select.value || null;
         });

        performGeneration(); // Use the common generation function
        closeModal();
    });

    // --- Reshuffle Button Listener ---
    reshuffleBtn.addEventListener('click', () => {
        console.log("Reshuffle clicked. Using current familyData.");
        performGeneration(); // Call the same generation logic
    });


}); // End DOMContentLoaded