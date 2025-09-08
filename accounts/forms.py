from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import ReadOnlyPasswordHashField
import re


User = get_user_model()

class SignUpForm(forms.ModelForm):
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
                "class": "form-control"
            }
        ))
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control form--control password-field"
            }
        ))
    password2 = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control form--control password-field"
            }
        ))

    class Meta:
        model = User
        fields = ['email', 'password', 'password2']
        
        labels = {
            'email': 'Email',
            'password': 'Senha',
            'password2': 'Confirme a senha'
        }
        


    def clean_email(self):
        '''
        Verify email is available.
        '''
        email = self.cleaned_data.get('email')
        qs = User.objects.filter(email=email)
        if qs.exists():
            self.add_error('email', 'Este email já existe.')
        return email


    def clean(self):
        '''
        Verify both passwords match.
        '''
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password2 = cleaned_data.get("password2")
        if password is not None and password != password2:
            self.add_error('password', 'As senhas não são iguais')
        return cleaned_data

    
    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super(SignUpForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password"])
        user.username = self.cleaned_data["email"]
        user.is_active = True # send confirmation email via signals
        # obj = EmailActivation.objects.create(user=user)
        # obj.send_activation_email()
        if commit:
            user.save()
        return user



class LoginForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={
                "class": "form-control"
            }
        ))
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "class": "form-control form--control password-field"
            }
        ))



def form_validation_error(form):
    msg = ""
    for field in form:
        for error in field.errors:
            msg += "%s: %s \\n" % (field.label if hasattr(field, 'label') else 'Error', error)
    return msg