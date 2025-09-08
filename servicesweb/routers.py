class MeuBancoRouter:
    def db_for_read(self, model, **hints):
        """Direciona leituras da app 'minha_app' para 'meu_banco'"""
        if model._meta.app_label == 'business':
            return 'business'
        return None

    def db_for_write(self, model, **hints):
        """Direciona escritas da app 'minha_app' para 'meu_banco'"""
        if model._meta.app_label == 'business':
            return 'business'
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Garante que APENAS 'minha_app' seja migrada no 'meu_banco'"""
        if app_label == 'business':
            return db == 'business'
        return False  # Impede que outras apps sejam migradas nesse banco