(function () {
    "use strict";

    /* basic select2 */
    document.querySelectorAll('.select2').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el);
    });

    /* multiple select */
    document.querySelectorAll('.js-example-basic-multiple').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, { plugins: ['remove_button'] });
    });

    // Single Select Placeholder
    document.querySelectorAll('#select2-with-placeholder').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            placeholder: 'Select a state',
            plugins: ['clear_button'],
            dir: 'ltr'
        });
    });

    /* single select with placeholder */
    document.querySelectorAll('#select2-placeholder-single').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            placeholder: 'Select a state',
            plugins: ['clear_button'],
            dir: 'ltr'
        });
    });

    /* multiple select with placeholder */
    document.querySelectorAll('.js-example-placeholder-multiple').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            placeholder: 'Select',
            plugins: ['remove_button']
        });
    });

    /* templating */
    function avatarRender(data, escape) {
        var baseUrl = '../assets/images/faces/select2';
        return '<div><img src="' + baseUrl + '/' + escape(data.value.toLowerCase()) + '.jpg" class="img-flag" /> ' + escape(data.text) + '</div>';
    }
    document.querySelectorAll('.js-example-templating').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            placeholder: 'Choose Customer',
            render: {
                option: avatarRender,
                item: avatarRender
            }
        });
    });

    /* with images */
    function clientAvatarRender(data, escape) {
        return '<div><img src="../assets/images/faces/select2/' + escape(data.value.toLowerCase()) + '.jpg" /> ' + escape(data.text) + '</div>';
    }
    document.querySelectorAll('.select2-client-search').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            placeholder: 'Choose Client',
            render: {
                option: clientAvatarRender,
                item: clientAvatarRender
            }
        });
    });

    /* max selections limiting */
    document.querySelectorAll('.js-example-basic-multiple-limit-max').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, {
            maxItems: 3,
            placeholder: 'Choose Person',
            plugins: ['remove_button']
        });
    });

    /* Disabling select 2 controls */
    document.querySelectorAll('.js-example-disabled').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el);
    });
    document.querySelectorAll('.js-example-disabled-multi').forEach(function (el) {
        if (!el.tomselect) new TomSelect(el, { plugins: ['remove_button'] });
    });

    document.querySelectorAll('.js-programmatic-enable').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.js-example-disabled, .js-example-disabled-multi').forEach(function (el) {
                if (el.tomselect) el.tomselect.enable();
            });
        });
    });
    document.querySelectorAll('.js-programmatic-disable').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.js-example-disabled, .js-example-disabled-multi').forEach(function (el) {
                if (el.tomselect) el.tomselect.disable();
            });
        });
    });

})();
