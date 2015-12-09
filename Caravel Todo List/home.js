// Framework7 initialization
window.framework7 = new Framework7();
window.$$ = Dom7;

$(document).on('ready', function() {
    var taskList = $('.js-list'), listWrapper = $('.js-list-wrapper');
    var noContent = $('.js-no-content');
    var bus = Caravel.get('Home');
    var template = null;
    var ptrContent = $$('.pull-to-refresh-content');
    var checkboxes;

    ptrContent.on('refresh', function() {
        bus.post('Refresh');
    });

    bus.register("Tasks", function(name, data) {
        if (template == null) { // Extract template
            var t = $('.js-task-template');
            template = t.clone();
            t.remove(); // Remove it from DOM tree
        }

        framework7.pullToRefreshDone();
        taskList.empty();
        checkboxes = {};

        if (data.length == 0) { // No task
            listWrapper.hide();
            noContent.show();
        } else {
            noContent.hide();
            listWrapper.show();

            for (var i = 0, s = data.length; i < s; i++) {
                var capture = function(e, t) {
                    var input = t.find('input');
                    input.val(e);
                    input.prop('checked', e.isCompleted);

                    t.find('.js-label').text(e.label);

                    // Store completion state for further update
                    checkboxes[e.id] = e.isCompleted;
                    t.on('click', function() {
                        var v = !checkboxes[e.id];
                        checkboxes[e.id] = v;
                        bus.post('Complete', {id: e.id, isCompleted: v});
                    });

                    t.find('.js-edit').on('click', function(event) {
                        framework7.prompt(
                            "Enter a new label",
                            "Edit task",
                            function(value) {
                                if (value.trim().length > 0) {
                                    bus.post("Edit", { id: e.id, label: value });
                                }
                            },
                            function() {} // Ignore
                        );
                        // Set input content
                        $('.modal-text-input').val(e.label);
                        // Close manually swipeout actions
                        framework7.swipeoutClose(t);
                        event.stopPropagation();
                    });

                    t.find('.js-delete').on('click', function(event) {
                        framework7.confirm(
                            "Are you sure you want to delete " + e.label + "?",
                            "Delete task",
                            function() {
                                bus.post("Delete", e.id);
                            },
                            function() {} // Ignore
                        );
                        // Close manually swipeout actions
                        framework7.swipeoutClose(t);
                        event.stopPropagation();
                    });

                    taskList.append(t);
                };

                // As we are manipulating loop variables, they need to be captured
                // before being used
                capture(data[i], template.clone());
            }
        }
    });

    $('.js-add').on('click', function() {
        framework7.prompt(
            "Enter a label",
            "Add a new task",
            function(value) {
                if (value.trim().length > 0) {  // Ignore empty values
                    bus.post("Add", value);
                }
            },
            function () {} // Ignore
        );
    });
});