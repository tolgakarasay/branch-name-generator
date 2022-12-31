function runExtension() {
    var summaryEl = document.getElementById('summary-val');
    var taskNumEl = document.getElementById('key-val');
    var taskTypeEl = document.getElementById('type-val');
    var issueHeaderContentEls = document.getElementsByClassName("issue-header-content");

    // Check if page has the required elements to run the script
    if (!summaryEl || !taskNumEl || !taskTypeEl || issueHeaderContentEls.length === 0) {
        console.log('Task number, summary, task type or issue header content not found. Branch name generator cannot work without these elements.');
        return;
    }

    var rawSummary = summaryEl.textContent;
    var taskNum = taskNumEl.textContent;
    var taskType = taskTypeEl.textContent;
    var projectKey = taskNum.split('-')[0];

    if (!summaryEl.getAttribute('data-dev-type')) {
        summaryEl.setAttribute('data-dev-type', '{"BD":false, "FD":false, "TL":false, "SA":false}');
    }

    if (!summaryEl.getAttribute('data-keep-original-tags')) {
        summaryEl.setAttribute('data-keep-original-tags', 'false');
    }

    // Activate / deactivate the extension by clicking the extension icon
    var prInfoEl = document.getElementById('bng-window');
    if (prInfoEl) {
        prInfoEl.remove();
    } else {
        renderWindow();
    }

    // get summary without original tags
    function getSummary() {
        return seperateOriginalTagsFromSummary(rawSummary)[1];
    }

    // get original tags
    function getOriginalTags() {
        var keepOriginalTags = summaryEl.getAttribute('data-keep-original-tags') === 'true' ? true : false;
        if (!keepOriginalTags) {
            return '';
        }
        var addSpaceBetween = localStorage.getItem('addSpaceBetween') === 'true' ? true : false;
        var originalTags = seperateOriginalTagsFromSummary(rawSummary)[0];
        if (addSpaceBetween) {
            return addSpaceBetweenSquareBrackets(originalTags);
        }

        return originalTags;
    }

    // Adds space charachter between square brackets if there isn't any
    // example: "[Lorem][Ipsum] Dolor sit amet"
    // returns: "[Lorem] [Ipsum] Dolor sit amet"
    function addSpaceBetweenSquareBrackets(text) {
        var newText = '';
        for (var i = 0; i < text.length; i++) {
            if (text[i] === ']' && i + 1 < text.length && text[i + 1] === '[') {
                newText += text[i] + ' ';
            } else {
                newText += text[i];
            }
        }
        return newText;
    }

    // seperate original tags from summary text
    function seperateOriginalTagsFromSummary(rawSummary) {
        var summary = '';
        var originalTags = '';
        var include = false;
        for (var i = 0; i < rawSummary.length; i++) {
            if (rawSummary[i] === '[') {
                originalTags += rawSummary[i];
                include = true;
                continue;
            } else if (rawSummary[i] === ']') {
                originalTags += rawSummary[i];
                include = false;
                continue;
            }

            if (include) {
                originalTags += rawSummary[i];
            } else {
                summary += rawSummary[i];
            }
        }
        return [originalTags.trim(), summary.trim()];
    }

    // Determine branch prefix
    function determineBranchPrefix(taskType) {
        var pattern = /bug/i;
        var result = pattern.test(taskType);
        if (result) {
            return 'bugfix';
        } else {
            return 'feature';
        }
    }

    // generate navigation bar html code
    function generateNavbar() {
        var navbar = `<div id="bng-navbar">
                        <a id="home-btn">
                            <span class="bng-navbar-icon aui-icon aui-icon-small aui-iconfont-home-filled"></span>
                            <span id="home-btn-text">Home</span>
                        </a>
                        <a id="settings-btn">
                            <span class="bng-navbar-icon aui-icon aui-icon-small aui-iconfont-settings"></span>
                            <span id="settings-btn-text">Settings</span>
                        </a>
                    </div>`;
        return navbar;
    }

    // generate settings page html code
    function generateSettingsPage() {
        var tableContent = generateTableContent();
        var settings = `<div id="bng-window-settings">
                                <div>
                                    <input  id="enable-extra-tags" type="checkbox" name="enable-extra-tags" value="false" ${localStorage.getItem('enableExtraTags') === 'true' ? 'checked' : ''}>
                                    <label for="enable-extra-tags"> Enable extra tags for branch name and PR title</label><br>
                                </div>
                                <table id="settings-table">
                                    <tr>
                                        <th></th>
                                        <th class="th-title">Extra tag for branch name</th>
                                        <th class="th-title">Extra tag for PR title</th>
                                    </tr>
                                    ${tableContent}
                                </table>
                                <br>
                                <div>
                                    <p id="additional-options-title">Additional options:</p>
                                    <input type="checkbox" id="add-space-between" name="add-space-between" value="false" ${localStorage.getItem('addSpaceBetween') === 'true' ? 'checked' : ''}>
                                    <label for="add-space-between"> Add space between square brackets</label><br>
                                    <input type="checkbox" id="keep-original-tags" name="keep-original-tags" ${summaryEl.getAttribute('data-keep-original-tags') === 'true' ? 'checked' : ''}>
                                    <label for="keep-original-tags"> Keep original tags in square brackets</label>
                                </div>
                                <br>
                            </div>`;
        return settings;
    }

    // generate table content html code
    function generateTableContent() {
        var localStorageExtraTags = localStorage.getItem(`extraTagsFor${projectKey}`);
        var status = localStorage.getItem('enableExtraTags') === 'true' ? '' : 'disabled';
        var className = localStorage.getItem('enableExtraTags') === 'true' ? '' : 'hide-input-values';
        var tableContent = '';
        if (!localStorageExtraTags) {
            localStorageExtraTags = '[]';
        }
        var localStorageExtraTagsArray = JSON.parse(localStorageExtraTags);
        var localStorageExtraTagsArrayLength = localStorageExtraTagsArray.length;

        for (var i = 0; i < 8; i += 2) {
            if (i < localStorageExtraTagsArrayLength) {
                tableContent += generateTableRow(i / 2 + 1, localStorageExtraTagsArray[i], localStorageExtraTagsArray[i + 1], className, status);
            } else {
                tableContent += generateTableRow(i / 2 + 1, '', '', className, status);
            }
        }
        return tableContent;
    }

    // Generate table row HTML code
    function generateTableRow(rowIndex, leftInput, rightInput, className, status) {
        var tableRow = `<tr>
                                <td class="row-index">${rowIndex}</td>
                                <td><input class="extra-tag ${className}" type="text" value="${leftInput}" ${status}></td>
                                <td><input class="extra-tag ${className}" type="text" value="${rightInput}" ${status}></td>
                            </tr>`;
        return tableRow;
    }

    // Generate Home Page HTML code
    function generateHomePage() {
        var list = generateList();
        var devTypeObject = JSON.parse(summaryEl.getAttribute('data-dev-type'));
        var home = `<div id="bng-window-home">
                        <div id="devtype-section">
                            <input type="checkbox" id="option1" name="option1" value="BD" ${devTypeObject.BD ? 'checked' : ''}>
                            <label for="option1"> Backend Dev.</label>
                            <input type="checkbox" id="option2" name="option2" value="FD" ${devTypeObject.FD ? 'checked' : ''}>
                            <label for="option2"> Frontend Dev.</label>
                            <input type="checkbox" id="option3" name="option3" value="TL" ${devTypeObject.TL ? 'checked' : ''}>
                            <label for="option3"> Tech Lead</label>
                            <input type="checkbox" id="option4" name="option4" value="SA" ${devTypeObject.SA ? 'checked' : ''}>
                            <label for="option4"> Solution Arch.</label><br>
                        </div>
                        <ul id="bng-window-list">
                            ${list}
                        </ul>
                    </div>`;
        return home;
    }

    // Display home page
    function displayHomePage() {
        saveExtraTags();
        document.getElementById('bng-window').remove();
        renderWindow();
        var home = document.getElementById('bng-window-home');
        var settings = document.getElementById('bng-window-settings');
        var homeBtnText = document.getElementById('home-btn-text');
        var settingsBtnText = document.getElementById('settings-btn-text');

        homeBtnText.style.textDecoration = 'underline';
        settingsBtnText.style.textDecoration = 'none';
        home.style.display = 'block';
        settings.style.display = 'none';
    }

    // Display settings page
    function displaySettingsPage() {
        // Not to lose the changes if the user clicks on settings link
        saveExtraTags();
        document.getElementById('bng-window').remove();
        renderWindow();
        var home = document.getElementById('bng-window-home');
        var settings = document.getElementById('bng-window-settings');
        var homeBtnText = document.getElementById('home-btn-text');
        var settingsBtnText = document.getElementById('settings-btn-text');

        homeBtnText.style.textDecoration = 'none';
        settingsBtnText.style.textDecoration = 'underline';
        home.style.display = 'none';
        settings.style.display = 'block';
    }

    // Render extension window
    function renderWindow() {
        var div = document.createElement('div');
        var navbar = generateNavbar();
        var home = generateHomePage();
        var settings = generateSettingsPage();
        div.innerHTML = navbar + settings + home;
        div.setAttribute('id', 'bng-window');
        issueHeaderContentEls[0].appendChild(div);

        // Add toggle functionality settings button
        document.getElementById('settings-btn').addEventListener('click', displaySettingsPage, false);
        document.getElementById('home-btn').addEventListener('click', displayHomePage, false);

        // Add toggle functionality to checkboxes
        for (var i = 1; i <= 4; i++) {
            document.getElementById('option' + i).addEventListener('change', toggleDevType, false);
        }

        // Add toggle for keeping or discarding original tags
        document.getElementById('enable-extra-tags').addEventListener('change', toggleEnableExtraTags, false);

        // Add toggle for keeping or discarding original tags
        document.getElementById('keep-original-tags').addEventListener('change', toggleKeepOriginalTags, false);

        // Add toggle for adding space between square brackets
        document.getElementById('add-space-between').addEventListener('change', toggleAddSpaceBetween, false);

        // Add copy to clipboard functionality to the buttons
        var copyButtons = document.getElementsByClassName('copyBtn');
        if (copyButtons) {
            for (var i = 0; i < copyButtons.length; i++) {
                copyButtons[i].addEventListener('click', copyContentToClipboard, false);
            }
        }
    }

    // Toggle developer type based on relevant checkbox
    function toggleDevType(event) {
        var devType = event.currentTarget.value;
        var elementsWithDevType = document.getElementsByClassName(`is${devType}`);
        var middleChar = localStorage.getItem('addSpaceBetween') === 'true' ? ' ' : '';
        var devTypeObjectString = summaryEl.getAttribute('data-dev-type');
        if (devTypeObjectString) {
            var devTypeObject = JSON.parse(devTypeObjectString);
            devTypeObject[devType] = event.currentTarget.checked;
            summaryEl.setAttribute('data-dev-type', JSON.stringify(devTypeObject));
        }
        if (elementsWithDevType) {
            for (var i = 0; i < elementsWithDevType.length; i++) {
                elementsWithDevType[i].innerHTML = event.currentTarget.checked ? `${middleChar}[${devType}]` : '';
            }
        }
    }

    // toggle enable extra tags option
    function toggleEnableExtraTags(event) {
        var inputElements = document.getElementsByClassName('extra-tag');
        if (event.currentTarget.checked) {
            localStorage.setItem('enableExtraTags', true);
            for (var i = 0; i < inputElements.length; i++) {
                inputElements[i].disabled = false;
                inputElements[i].classList.remove('hide-input-values');
            }
        } else {
            localStorage.setItem('enableExtraTags', false);
            for (var i = 0; i < inputElements.length; i++) {
                inputElements[i].disabled = true;
                inputElements[i].classList.add('hide-input-values');
            }
        }
    }

    // toggle keep original tags option
    function toggleKeepOriginalTags(event) {
        if (event.currentTarget.checked) {
            summaryEl.setAttribute('data-keep-original-tags', true);
        } else {
            summaryEl.setAttribute('data-keep-original-tags', false);
        }
    }

    // toggle add space between option
    function toggleAddSpaceBetween(event) {
        if (event.currentTarget.checked) {
            localStorage.setItem('addSpaceBetween', true);
        } else {
            localStorage.setItem('addSpaceBetween', false);
        }
    }

    // Copy text content to clipboard
    function copyContentToClipboard(event) {
        // copy text content to clipboard
        var content = event.currentTarget.closest('li').children[0].textContent;
        navigator.clipboard.writeText(content);
        // add visual effect to the selected text
        var span = event.currentTarget.closest('li').children[0];
        span.classList.add('highlighted1');
        setTimeout(() => span.classList.add('highlighted2'), 200);
        setTimeout(() => span.classList.remove('highlighted1'), 200);
        setTimeout(() => span.classList.remove('highlighted2'), 1000);
    }

    // Save extra tags
    function saveExtraTags() {
        var inputArray = [];
        var inputElements = document.getElementsByClassName('extra-tag');
        // to secure the input, remove html tags if any
        var pattern = /<[^>]+>/g;
        for (var i = 0; i < inputElements.length; i += 2) {
            var leftInput = inputElements[i].value.replace(pattern, '');
            var rightInput = inputElements[i + 1].value.replace(pattern, '');
            if (leftInput || rightInput) {
                inputArray.push(leftInput);
                inputArray.push(rightInput);
            }
        }
        localStorage.setItem(`extraTagsFor${projectKey}`, JSON.stringify(inputArray));
    }

    // Generate a pair of list items consisting of branch name and PR title
    function generateACoupleOfListItems(extraTagForBranch, extraTagForPR) {
        var branchPrefix = determineBranchPrefix(taskType);
        var devTypeObject = JSON.parse(summaryEl.getAttribute('data-dev-type'));
        extraTagForBranch = extraTagForBranch === '' ? '' : `-${extraTagForBranch}`;
        var middleChar = localStorage.getItem('addSpaceBetween') === 'true' ? ' ' : '';
        var summary = getSummary();
        var originalTags = getOriginalTags();
        originalTags = originalTags === '' ? '' : middleChar + originalTags;
        extraTagForPR = extraTagForPR === '' ? '' : `${middleChar}[${extraTagForPR}]`;

        var aCoupleOfListItems = `<li>
                                        <span class="list-item">${branchPrefix}/${taskNum}${extraTagForBranch}</span>
                                        <button class="copyBtn">Copy</button>
                                    </li>
                                    <li>
                                        <span class="list-item">[${taskNum}]<span class="isSA">${devTypeObject.SA ? middleChar + '[SA]' : ''}</span><span class="isTL">${devTypeObject.TL ? middleChar + '[TL]' : ''}</span><span class="isBD">${
            devTypeObject.BD ? middleChar + '[BD]' : ''
        }</span><span class="isFD">${devTypeObject.FD ? middleChar + '[FD]' : ''}</span>${extraTagForPR}${originalTags}&nbsp;${summary}</span>
                                        <button class="copyBtn">Copy</button>
                                    </li>
                                    <br>`;
        return aCoupleOfListItems;
    }

    // generate list html code
    function generateList() {
        var list = '';
        var localStorageExtraTags = localStorage.getItem(`extraTagsFor${projectKey}`);
        var enableExtraTags = localStorage.getItem('enableExtraTags');
        if (localStorageExtraTags && enableExtraTags !== 'false') {
            localStorageExtraTags = JSON.parse(localStorageExtraTags);
            if (localStorageExtraTags.length < 2) {
                return generateACoupleOfListItems('', '');
            }

            for (var i = 0; i < localStorageExtraTags.length; i += 2) {
                var aCoupleOfListItems = generateACoupleOfListItems(localStorageExtraTags[i], localStorageExtraTags[i + 1]);
                list += aCoupleOfListItems;
            }

            return list;
        } else {
            return generateACoupleOfListItems('', '');
        }
    }

}

chrome.action.onClicked.addListener((tab) => {
    if (tab.url.startsWith('https://dev.osf.digital')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: runExtension
        });
    }
});
