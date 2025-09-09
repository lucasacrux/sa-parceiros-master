import { supabase } from "@/integrations/supabase/client";
import type { TenantConfig, ThemeTokens, LoginMethods, PaymentMethods } from "@/types/portal";

export async function upsertTenantAndConfig(input: {
  slug: string;
  name: string;
  site_url?: string;
  type: "semi" | "full";
  tokens: ThemeTokens;
  login_methods: LoginMethods;
  payments: PaymentMethods;
  logoFile?: File | null;
}) {
  try {
    // 1) Upsert tenant - use onConflict to handle existing slugs
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .upsert(
        { 
          slug: input.slug, 
          nome: input.name, // Use nome field that exists in schema
          name: input.name,
          site_oficial: input.site_url,
          site_url: input.site_url,
          created_by: (await supabase.auth.getUser()).data.user?.id 
        },
        { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Falha ao persistir tenant: ${tenantError?.message}`);
    }

    // 2) Upload logo if provided
    let logoUrl: string | undefined = undefined;
    if (input.logoFile) {
      const fileExt = input.logoFile.name.split(".").pop() || "png";
      const path = `tenants/${tenant.id}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tenants")
        .upload(path, input.logoFile, { upsert: true });

      if (uploadError) {
        console.warn("Failed to upload logo:", uploadError);
      } else if (uploadData?.path) {
        const { data: publicData } = supabase.storage
          .from("tenants")
          .getPublicUrl(uploadData.path);
        logoUrl = publicData?.publicUrl;
        input.tokens.logoUrl = logoUrl;
      }
    }

    // 3) Upsert portal config
    const { error: configError } = await supabase
      .from("portal_configs")
      .upsert({
        tenant_id: tenant.id,
        type: input.type,
        tokens: input.tokens,
        login_methods: input.login_methods,
        payments: input.payments
      });

    if (configError) {
      throw new Error(`Falha ao persistir configuração: ${configError.message}`);
    }

    return { tenant_id: tenant.id, logoUrl };
  } catch (error) {
    console.error("Error in upsertTenantAndConfig:", error);
    throw error;
  }
}

export async function getTenantBySlug(slug: string): Promise<TenantConfig | null> {
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, slug, name, site_url")
      .eq("slug", slug)
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant not found:", tenantError);
      return null;
    }

    const { data: config, error: configError } = await supabase
      .from("portal_configs")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    if (configError || !config) {
      console.error("Portal config not found:", configError);
      return null;
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      site_url: tenant.site_url,
      type: config.type as "semi" | "full",
      tokens: config.tokens as ThemeTokens,
      login_methods: config.login_methods as LoginMethods,
      payments: config.payments as PaymentMethods,
    };
  } catch (error) {
    console.error("Error in getTenantBySlug:", error);
    return null;
  }
}

export function applyTheme(config: TenantConfig) {
  const root = document.documentElement;
  root.setAttribute("data-tenant", config.slug);
  
  const tokens = config.tokens;
  root.style.setProperty("--sa-primary", tokens.primary);
  root.style.setProperty("--sa-secondary", tokens.secondary);
  root.style.setProperty("--sa-bg", tokens.bg);
  root.style.setProperty("--sa-fg", tokens.fg);
  root.style.setProperty("--sa-muted", tokens.muted);
  root.style.setProperty("--sa-radius", `${tokens.radius}px`);
  
  // Apply favicon if provided
  if (tokens.faviconUrl) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = tokens.faviconUrl;
    }
  }
}