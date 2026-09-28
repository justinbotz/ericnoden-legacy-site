( function ($, helper) {

  const {
    modal,
    errorDialog,
    loadingDots,
    select,
    uuid,
    addMediaToBasicTinyMCE,
    specialChars,
    tinymceElement,
    searchOptionsWidget,
    loadingModal,
    input,
    isNumeric,
    icons,
    dialog,
    progressBar,
    tooltip,
    regexp,
    isValidEmail,
    textarea,
    spinner,

  } = Groundhogg.element
  const { post, patch, routes, get, delete: __delete } = Groundhogg.api
  const { sprintf, __, _x, _n } = wp.i18n
  const { currentUser } = Groundhogg
  const { route, master_license } = helper
  let { installed } = helper

  let downloads
  let search
  let terms
  let filterByTerms

  const downloadTemplate = (download) => {
    //language=HTML
    return `
        <div class="gh-panel">
            <div class="inside">
                <div class="space-between align-top gap-20">
                    <img src="${ download.info.thumbnail }">
                    <div class="right">
                        <h2>${ download.info.title }</h2>
                        <div class="description">
                            ${ download.info.excerpt }
                        </div>
                    </div>
                </div>
            </div>
            <div class="plugin-actions space-between">
                <a href="#" class="more-details" data-id="${ download.info.id }"
                   target="_blank">${ __('More details') }</a>
                <button data-id="${ download.info.id }"
                        class="gh-button install-download secondary"
                        ${ installed.includes(download.info.id)
                                ? 'disabled'
                                : '' }>
                    ${ installed.includes(download.info.id) ? __('Installed',
                            'groundhogg') : __('Install & Activate',
                            'groundhogg-helper') }
                </button>
            </div>
        </div>`
  }

  const mount = () => {
    $('#extensions-here').
      html(downloads.filter(d => !search || d.info.title.match(regexp(search))).
        filter(d => {
          if (!filterByTerms || !filterByTerms.length) {
            return true
          }

          let { tags, categories } = d.info

          let terms = [
            ...Array.isArray(tags) ? tags : [],
            ...Array.isArray(categories) ? categories : [],
          ]

          for (let i = 0; i < filterByTerms.length; i++) {
            if (terms.find(t => t.term_id == filterByTerms[i])) {
              return true
            }
          }

          return false
        }).
        map(d => downloadTemplate(d)).
        join(''))
    onMount()
  }

  const onMount = () => {

    // To keep the sidebar scrolling
    window.dispatchEvent(new Event('resize'))

    $('.more-details').on('click', e => {

      e.preventDefault()

      const $link = $(e.currentTarget)

      let downloadId = $link.data('id')
      let download = downloads.find(d => d.info.id == downloadId)

      modal({
        dialogClasses: 'no-padding',
        //language=HTML
        content: `
            <img class="thumbnail" src="${ download.info.thumbnail }">
            <div id="more-details-content">
                <h1>${ download.info.title }</h1>
                <p><a href="${ download.info.link }">${ __(
                        'View on Groundhogg.io') }</a></p>
                ${ download.info.content }
            </div>`,
        width: 500,
      })

    })

    $('.install-download').on('click', e => {

      const $btn = $(e.currentTarget)

      let downloadId = $btn.data('id')
      let download = downloads.find(d => d.info.id == downloadId)

      $btn.prop('disabled', true)
      $btn.text(__('Installing', 'groundhogg-helper'))
      let { stop } = loadingDots(e.currentTarget)

      post(`${ route }/${ downloadId }`).then(r => {

        installed.push(download.info.id)

        stop()
        mount()

        dialog({
          message: sprintf(__('Installed %s!', 'groundhogg-helper'),
            download.info.title),
        })

      }).catch(er => {
        stop()
        mount()
        errorDialog({
          message: er.message,
        })
      })

    })
  }

  const init = (r) => {

    $('.gh-header').removeClass('hidden')

    installed = r.installed
    downloads = r.downloads

    terms = downloads.reduce((arr, d) => {

      let { tags, categories } = d.info

      if (tags) {
        tags.forEach(t => {
          if (!arr.find(_t => _t.term_id == t.term_id)) {
            arr.push(t)
          }
        })

      }

      if (categories) {
        categories.forEach(c => {
          if (!arr.find(_c => _c.term_id == c.term_id)) {
            arr.push(c)
          }
        })
      }

      return arr
    }, [])

    $('#filter-by-taxonomy').select2({
      data: terms.map(term => ( {
        id: term.term_id,
        text: term.name,
      } )),
      multiple: true,
      placeholder: __('Filter by category'),
    }).on('change', (e) => {
      window.scrollTo(0, 0)

      filterByTerms = $(e.target).val()

      mount()
    })

    mount()
  }

  const updateLicenses = (newLicense, setProgress = () => {}, done) => {
    patch(route, {
      master_license: newLicense,
    }).then(r => {

      // copy
      let _installed = [...installed]

      const updateLicense = () => {

        let item = _installed.pop()

        if (!item) {
          return
        }

        patch(`${ route }/${ item }`).then(r => {

          setProgress(
            ( installed.length - _installed.length ) / installed.length)

          if (_installed.length) {
            updateLicense()
            return
          }

          dialog({
            message: __('License updated!', 'groundhogg-helper'),
          })

          done()

        })

      }

      updateLicense()

    }).catch(er => {
      errorDialog({
        message: er.message,
      })
    })
  }

  $(() => {

    filterByTerms = GroundhoggHelper.terms

    $('#extensions-here').html(spinner())
    $('#ext-search').on('input', (e) => {
      window.scrollTo(0, 0)
      search = e.target.value
      mount()
    })

    $('#refresh-downloads').on('click', () => {
      let { close } = loadingModal()

      __delete(route).then((r) => {
        dialog({
          message: __('Refreshed!'),
        })
        init(r)
        close()
      }).catch(e => {
        close()
        dialog({
          type: 'error',
          message: e.message,
        })
      })
    })

    $('#change-license').on('click', (e) => {
      modal({
        // language=HTML
        content: `
            <div>
                <h2>${ __('Change your license key', 'groundhogg-helper') }</h2>
                <div class="gh-input-group">
                    ${ input({
                        id: 'license-key',
                        value: master_license,
                    }) }
                    <button id="commit-change-license"
                            class="gh-button primary">
                        ${ __('Change License', 'groundhogg-helper') }
                    </button>
                </div>
            </div>`,
        onOpen: ({ close, setContent }) => {

          let newLicense

          const $commitBtn = $('#commit-change-license')

          if (master_license) {
            $commitBtn.prop('disabled', true)
          }

          $('#license-key').on('change input', e => {
            $commitBtn.prop('disabled', false)
            newLicense = e.target.value
          })

          $commitBtn.on('click', () => {

            // language=HTML
            let UI = `
                <div>
                    <h2>${ __('Updating your license...', 'groundhogg') }</h2>
                    <div id="progress"></div>
                </div>`

            setContent(UI)

            let { setProgress } = progressBar('#progress')

            updateLicenses(newLicense, setProgress, close)

          })

        },
      })
    })

    if (master_license) {
      get(route).then(r => {
        init(r)
      }).catch(e => {

        dialog({
          type: 'error',
          message: e.message,
        })
      })
    }
    else {

      // show license form
      //language=HTML
      let UI = `
          <div id="add-license">
              <div id="logo">
                  ${ icons.groundhogg_black }
              </div>
              <div class="gh-panel">
                  <div class="inside">
                      <h1>${ __('Add your license key!',
                              'groundhogg-helper') }</h1>
                      <div class="display-flex gap-10">
                          ${ input({
                              placeholder: __( 'Your license key...' ),
                              id: 'license-key',
                              value: master_license,
                          }) }
                          <button id="commit-change-license"
                                  class="gh-button primary">
                              ${ __('Change License', 'groundhogg-helper') }
                          </button>
                      </div>
                      <p><a href="https://www.groundhogg.io/account/licenses/"
                            target="_blank">${ __(
                              'Where do I find my license key?',
                              'groundhogg') }</a></p>
                  </div>
              </div>
          </div>`

      $('#extensions-here').html('')
      $(UI).insertAfter('#extensions-here')

      let newLicense

      const $commitBtn = $('#commit-change-license')

      $('#license-key').on('change input', e => {
        newLicense = e.target.value
      })

      $commitBtn.on('click', () => {

        // language=HTML
        let UI = `
            <div>
                <h2>${ __('Updating your license...', 'groundhogg') }</h2>
                <div id="progress"></div>
            </div>`

        $('#add-license .inside').html(UI)

        let { setProgress } = progressBar('#progress')

        updateLicenses(newLicense, setProgress, () => {
          get(route).then(r => {

            $('#add-license').remove()

            init(r)
          }).catch(e => {

            dialog({
              type: 'error',
              message: e.message,
            })
          })
        })

      })

    }
  })

} )(jQuery, GroundhoggHelper)
