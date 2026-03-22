import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { TuiAutoFocus, tuiMarkControlAsTouchedAndValidate } from '@taiga-ui/cdk'
import { TuiButton, TuiDialogContext, TuiError, TuiInput } from '@taiga-ui/core'
import { TuiNotificationMiddleService } from '@taiga-ui/kit'
import { TuiForm } from '@taiga-ui/layout'
import { injectContext, PolymorpheusComponent } from '@taiga-ui/polymorpheus'
import { ApiService } from 'src/app/services/api/api.service'

@Component({
  template: `
    <form tuiForm [formGroup]="form">
      <tui-textfield>
        <label tuiLabel>Name</label>
        <input tuiInput tuiAutoFocus formControlName="name" />
      </tui-textfield>
      <tui-error formControlName="name" />
      @if (!context.data.name) {
        <tui-textfield>
          <label tuiLabel>IP Range</label>
          <input tuiInput formControlName="subnet" />
        </tui-textfield>
        <tui-error formControlName="subnet" />
      }
      <tui-textfield>
        <label tuiLabel>IPv6 Prefix (optional)</label>
        <input
          tuiInput
          formControlName="ipv6Prefix"
          placeholder="e.g., 2606:cc0:11:2009::/64"
        />
      </tui-textfield>
      <footer>
        <button tuiButton (click)="onSave()">Save</button>
      </footer>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TuiAutoFocus,
    TuiButton,
    TuiError,
    TuiForm,
    TuiInput,
  ],
})
export class SubnetsAdd {
  private readonly api = inject(ApiService)
  private readonly loading = inject(TuiNotificationMiddleService)

  protected readonly context = injectContext<TuiDialogContext<void, Data>>()
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [this.context.data.name, Validators.required],
    subnet: [
      this.context.data.subnet,
      [
        Validators.required,
        Validators.pattern(
          '^(?:(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)/(?:[0-9]|1\\d|2[0-4])$',
        ),
      ],
    ],
    ipv6Prefix: [this.context.data.ipv6Prefix || ''],
  })

  protected async onSave() {
    if (this.form.invalid) {
      tuiMarkControlAsTouchedAndValidate(this.form)

      return
    }

    const loader = this.loading.open('').subscribe()
    const value = this.form.getRawValue()

    try {
      this.context.data.name
        ? await this.api.editSubnet(value)
        : await this.api.addSubnet(value)
    } catch (e) {
      console.log(e)
    } finally {
      loader.unsubscribe()
      this.context.$implicit.complete()
    }
  }
}

export const SUBNETS_ADD = new PolymorpheusComponent(SubnetsAdd)

interface Data {
  name: string
  subnet: string
  ipv6Prefix?: string
}
