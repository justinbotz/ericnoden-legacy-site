( ($) => {

  const { createFilters } = Groundhogg.filters.functions
  const { ContactFilterDisplay } = Groundhogg.filters
  const {
    select,
    toggle,
  } = Groundhogg.element

  const {
    sprintf,
    __,
    _x,
    _n,
  } = wp.i18n


  const LogicBuilder = {

    init () {

      $(document).on('step-active', e => {

        console.log( 'logic here' )

        // remove the logic editor from other steps.
        $('.step-settings .step .step-conditional-logic').html('')

        this.mount()
      })

    },

    mount () {
      let activeStep = Funnel.getActiveStep()

      let $container = $('.step-settings .step.editing .step-conditional-logic')
      $container.html(this.render(activeStep))
      this.onMount(activeStep, {
        updateStepMeta: (meta) => Funnel.updateStepMeta(meta),
      })
    },

    render ({
      ID,
      data,
      meta,
    }) {

      const {
        step_group,
        step_level,
        step_order,
        branch,
      } = data

      const {
        _conditional_logic = {},
        _conditional_logic_enabled = false,
      } = meta

      const {
        result = 'skip',
        skip_to,
        filters = [],
      } = _conditional_logic

      const resultSelect = select({
        id  : 'logic-result',
        name: 'result',
      }, {
        skip   : __('Skip this step', 'groundhogg-logic'),
        skip_to: __('Skip to another step', 'groundhogg-logic'),
        stop   : __('Stop the funnel', 'groundhogg-logic'),
      }, result)

      let skipToOptions = Funnel.steps.filter(s => s.data.step_level > step_level && s.data.step_order > step_order && s.data.branch === branch && s.data.step_group === 'action')
      skipToOptions.sort((a, b) => a.step_order - b.step_order)

      const skipToSelect = select({
        id  : 'logic-skip-to',
        name: 'skip_to',
      }, skipToOptions.map(s => ( {
        value: s.ID,
        text : `${ s.data.step_order }. ${ s.data.step_title }`,
      } )), skip_to)

      const logicResult = () => {
        return `<div class="gh-input-group">${ resultSelect }${ result === 'skip_to' && skipToOptions.length ? skipToSelect : '' }</div>`
      }

      //language=HTML
      return `
          <div class="gh-panel ${ Boolean(_conditional_logic_enabled) ? 'open' : 'closed' }">
              <div class="gh-panel-header">
                  <h2>${ __('Conditional Logic') }</h2>
                  <div class="logic-toggle">
                      ${ toggle({
                          id     : 'enable-conditional-logic',
                          name   : 'enable_conditional_logic',
                          checked: Boolean(_conditional_logic_enabled),
                      }) }
                  </div>
              </div>
              <div class="inside">
                  <div id="conditional-logic-panel" class="display-flex gap-20 column">
                      <p>${ step_group === 'action'
                            ? __('Run if the contact satisfies the following conditions.', 'groundhogg')
                            : __('Complete if the contact satisfies the following conditions.', 'groundhogg') }
                      </p>
                      <div id="logic-include-filters"></div>
                      <div id="logic-exclude-filters"></div>
                      ${ step_group === 'action' ? `<span>${ __('Otherwise...', 'groundhogg-logic') }</span>` : '' }
                      ${ step_group === 'action' ? logicResult() : '' }
                  </div>
              </div>
          </div>`
    },

    onMount (step, {
      updateStepMeta = () => {},
      updateStep = () => {},
    }) {

      let {
        _conditional_logic = {},
        _conditional_logic_enabled = false,
      } = step.meta

      let {
        filters = [],
        exclude_filters = [],
      } = _conditional_logic

      const updateLogic = (logic, reRender = false) => {

        _conditional_logic = {
          ..._conditional_logic,
          ...logic,
        }

        updateStepMeta({
          _conditional_logic,
        })

        if (reRender) {
          this.mount()
        }
      }

      let includeFilters = createFilters('#logic-include-filters', filters, _filters => updateLogic({ filters: _filters }))
      let excludeFilters = createFilters('#logic-exclude-filters', exclude_filters, _exclude_filters => updateLogic({ exclude_filters: _exclude_filters }))

      if (_conditional_logic_enabled) {
        includeFilters.init()
        excludeFilters.init()
      }

      $('#logic-result').on('change', function () {
        updateLogic({
          result: $(this).val(),
        }, true)
      })

      $('#logic-skip-to').on('change', function () {
        updateLogic({
          skip_to: parseInt($(this).val()),
        })
      })

      $('#enable-conditional-logic').on('change', e => {
        const step = updateStepMeta({
          _conditional_logic_enabled: e.target.checked,
        })

        this.mount()
      })
    },
  }

  const {
    Div,
    Span,
  } = MakeEl

  const logicHelpers = () => {

    $('#step-flow .logic-display').each((i, el) => {

      let id = el.dataset.id
      const step = Funnel.steps.find(s => s.ID == id)
      let {
        filters = [],
        exclude_filters = [],
      } = step.meta._conditional_logic

      morphdom(el, Div({}, [
        Span({}, '<i>IF</i> '),
        filters.length ? ContactFilterDisplay(filters) : null,
        filters.length ? '<br/>' : null,
        exclude_filters.length ? Span({}, filters.length ? '<i>AND NOT</i> ' : '<i>NOT</i> ') : null,
        exclude_filters.length ? ContactFilterDisplay(exclude_filters) : null,
      ]), {
        childrenOnly: true,
      })
    })
  }

  $(document).on('draw-logic-lines', logicHelpers )

  $(() => {
    LogicBuilder.init()
    $(document).on('new-step', e => logicHelpers())

  })

} )(jQuery)
