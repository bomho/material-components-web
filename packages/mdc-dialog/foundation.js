/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {MDCFoundation} from '@material/base/index';
import {cssClasses, strings} from './constants';

export default class MDCDialogFoundation extends MDCFoundation {
  static get cssClasses() {
    return cssClasses;
  }

  static get strings() {
    return strings;
  }

  static get defaultAdapter() {
    return ({
      addClass: (/* className: string */) => {},
      removeClass: (/* className: string */) => {},
      addBodyClass: (/* className: string */) => {},
      removeBodyClass: (/* className: string */) => {},
      eventTargetHasClass: (/* target: EventTarget, className: string */) => /* boolean */ false,
      registerInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      deregisterInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      registerSurfaceInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      deregisterSurfaceInteractionHandler: (/* evt: string, handler: EventListener */) => {},
      registerDocumentKeydownHandler: (/* handler: EventListener */) => {},
      deregisterDocumentKeydownHandler: (/* handler: EventListener */) => {},
      notifyAccept: () => {},
      notifyCancel: () => {},
      trapFocusOnSurface: () => {},
      untrapFocusOnSurface: () => {},
      isDialog: (/* el: Element */) => /* boolean */ false,
    });
  }

  constructor(adapter) {
    super(Object.assign(MDCDialogFoundation.defaultAdapter, adapter));
    this.isOpen_ = false;
    this.componentClickHandler_ = (evt) => {
      if (this.adapter_.eventTargetHasClass(evt.target, cssClasses.BACKDROP)) {
        this.cancel(true);
      }
    };
    this.dialogClickHandler_ = (evt) => this.handleDialogClick_(evt);
    this.documentKeydownHandler_ = (evt) => {
      if (evt.key && evt.key === 'Escape' || evt.keyCode === 27) {
        this.cancel(true);
      }
    };

    this.timerId_ = 0;
    this.animationTimerEnd_ = (evt) => this.handleAnimationTimerEnd_(evt);
  };

  destroy() {
    // Ensure that dialog is cleaned up when destroyed
    if (this.isOpen_) {
      this.close();
    }
    // Final cleanup of animating class in case the timer has not completed.
    this.adapter_.removeClass(MDCDialogFoundation.cssClasses.ANIMATING);
    clearTimeout(this.timerId_);
  }

  open() {
    this.isOpen_ = true;
    this.disableScroll_();
    this.adapter_.registerDocumentKeydownHandler(this.documentKeydownHandler_);
    this.adapter_.registerSurfaceInteractionHandler('click', this.dialogClickHandler_);
    this.adapter_.registerInteractionHandler('click', this.componentClickHandler_);
    clearTimeout(this.timerId_);
    this.timerId_ = setTimeout(this.animationTimerEnd_, MDCDialogFoundation.numbers.DIALOG_ANIMATION_TIME_MS);
    this.adapter_.addClass(MDCDialogFoundation.cssClasses.ANIMATING);
    this.adapter_.addClass(MDCDialogFoundation.cssClasses.OPEN);
  }

  close() {
    this.isOpen_ = false;
    this.enableScroll_();
    this.adapter_.deregisterSurfaceInteractionHandler('click', this.dialogClickHandler_);
    this.adapter_.deregisterDocumentKeydownHandler(this.documentKeydownHandler_);
    this.adapter_.deregisterInteractionHandler('click', this.componentClickHandler_);
    this.adapter_.untrapFocusOnSurface();
    clearTimeout(this.timerId_);
    this.timerId_ = setTimeout(this.animationTimerEnd_, MDCDialogFoundation.numbers.DIALOG_ANIMATION_TIME_MS);
    this.adapter_.addClass(MDCDialogFoundation.cssClasses.ANIMATING);
    this.adapter_.removeClass(MDCDialogFoundation.cssClasses.OPEN);
  }

  isOpen() {
    return this.isOpen_;
  }

  accept(shouldNotify) {
    if (shouldNotify) {
      this.adapter_.notifyAccept();
    }

    this.close();
  }

  cancel(shouldNotify) {
    if (shouldNotify) {
      this.adapter_.notifyCancel();
    }

    this.close();
  }

  handleDialogClick_(evt) {
    const {target} = evt;
    if (this.adapter_.eventTargetHasClass(target, cssClasses.ACCEPT_BTN)) {
      this.accept(true);
    } else if (this.adapter_.eventTargetHasClass(target, cssClasses.CANCEL_BTN)) {
      this.cancel(true);
    }
  }

  handleAnimationTimerEnd_() {
    this.adapter_.removeClass(MDCDialogFoundation.cssClasses.ANIMATING);
    if (this.isOpen_) {
      this.adapter_.trapFocusOnSurface();
    }
  };

  disableScroll_() {
    this.adapter_.addBodyClass(cssClasses.SCROLL_LOCK);
  }

  enableScroll_() {
    this.adapter_.removeBodyClass(cssClasses.SCROLL_LOCK);
  }
}
