export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          bloqueada: boolean
          booking_id: string
          comentario: string | null
          cordialidade: number | null
          criado_em: string
          editada_em: string | null
          id: string
          nota: number
          pontualidade: number | null
          qualidade: number | null
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          bloqueada?: boolean
          booking_id: string
          comentario?: string | null
          cordialidade?: number | null
          criado_em?: string
          editada_em?: string | null
          id?: string
          nota: number
          pontualidade?: number | null
          qualidade?: number | null
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          bloqueada?: boolean
          booking_id?: string
          comentario?: string | null
          cordialidade?: number | null
          criado_em?: string
          editada_em?: string | null
          id?: string
          nota?: number
          pontualidade?: number | null
          qualidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_avaliado_id_fkey"
            columns: ["avaliado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_extras: {
        Row: {
          booking_id: string
          extra_id: string
          id: string
          preco_congelado: number
        }
        Insert: {
          booking_id: string
          extra_id: string
          id?: string
          preco_congelado?: number
        }
        Update: {
          booking_id?: string
          extra_id?: string
          id?: string
          preco_congelado?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "extras"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          aceito_em: string | null
          area_externa: string
          banheiros: number
          checkin_em: string | null
          cliente_confirmado_em: string | null
          cliente_id: string
          codigo: string | null
          copa: number
          cozinha: boolean
          cozinhas: number
          criado_em: string
          data: string | null
          duracao_horas: number
          endereco_id: string | null
          faixa_metragem: string | null
          faixa_pessoas: string | null
          finalizado_em: string | null
          hora: string | null
          id: string
          iniciado_em: string | null
          observacoes: string | null
          outros_ambientes: string | null
          pagamento_liberado_em: string | null
          problema_relatado: string | null
          profissional_id: string | null
          qtd_profissionais: number
          quartos: number
          recepcao: number
          recusadas: string[]
          regiao: string | null
          salas: number
          salas_reuniao: number
          status: string
          taxa_admin: number
          tipo_imovel: string | null
          tipo_limpeza: string
          valor_extras: number
          valor_profissional: number
          valor_seguro: number
          valor_total: number
        }
        Insert: {
          aceito_em?: string | null
          area_externa?: string
          banheiros?: number
          checkin_em?: string | null
          cliente_confirmado_em?: string | null
          cliente_id: string
          codigo?: string | null
          copa?: number
          cozinha?: boolean
          cozinhas?: number
          criado_em?: string
          data?: string | null
          duracao_horas?: number
          endereco_id?: string | null
          faixa_metragem?: string | null
          faixa_pessoas?: string | null
          finalizado_em?: string | null
          hora?: string | null
          id?: string
          iniciado_em?: string | null
          observacoes?: string | null
          outros_ambientes?: string | null
          pagamento_liberado_em?: string | null
          problema_relatado?: string | null
          profissional_id?: string | null
          qtd_profissionais?: number
          quartos?: number
          recepcao?: number
          recusadas?: string[]
          regiao?: string | null
          salas?: number
          salas_reuniao?: number
          status?: string
          taxa_admin?: number
          tipo_imovel?: string | null
          tipo_limpeza?: string
          valor_extras?: number
          valor_profissional?: number
          valor_seguro?: number
          valor_total?: number
        }
        Update: {
          aceito_em?: string | null
          area_externa?: string
          banheiros?: number
          checkin_em?: string | null
          cliente_confirmado_em?: string | null
          cliente_id?: string
          codigo?: string | null
          copa?: number
          cozinha?: boolean
          cozinhas?: number
          criado_em?: string
          data?: string | null
          duracao_horas?: number
          endereco_id?: string | null
          faixa_metragem?: string | null
          faixa_pessoas?: string | null
          finalizado_em?: string | null
          hora?: string | null
          id?: string
          iniciado_em?: string | null
          observacoes?: string | null
          outros_ambientes?: string | null
          pagamento_liberado_em?: string | null
          problema_relatado?: string | null
          profissional_id?: string | null
          qtd_profissionais?: number
          quartos?: number
          recepcao?: number
          recusadas?: string[]
          regiao?: string | null
          salas?: number
          salas_reuniao?: number
          status?: string
          taxa_admin?: number
          tipo_imovel?: string | null
          tipo_limpeza?: string
          valor_extras?: number
          valor_profissional?: number
          valor_seguro?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_endereco_id_fkey"
            columns: ["endereco_id"]
            isOneToOne: false
            referencedRelation: "enderecos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      cancelamentos: {
        Row: {
          autor_id: string | null
          booking_id: string
          criado_em: string
          id: string
          motivo: string | null
          papel: string
          valor_total: number
        }
        Insert: {
          autor_id?: string | null
          booking_id: string
          criado_em?: string
          id?: string
          motivo?: string | null
          papel?: string
          valor_total?: number
        }
        Update: {
          autor_id?: string | null
          booking_id?: string
          criado_em?: string
          id?: string
          motivo?: string | null
          papel?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cancelamentos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancelamentos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidade: {
        Row: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          profissional_id: string
        }
        Insert: {
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
          profissional_id: string
        }
        Update: {
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidade_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      enderecos: {
        Row: {
          apelido: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string
          estado: string | null
          id: string
          latitude: number | null
          longitude: number | null
          numero: string | null
          padrao: boolean
          regiao: string | null
          rua: string | null
          user_id: string
        }
        Insert: {
          apelido?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          numero?: string | null
          padrao?: boolean
          regiao?: string | null
          rua?: string | null
          user_id: string
        }
        Update: {
          apelido?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          numero?: string | null
          padrao?: boolean
          regiao?: string | null
          rua?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enderecos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extras: {
        Row: {
          ativo: boolean
          descricao: string | null
          id: string
          minutos_adicionais: number
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          minutos_adicionais?: number
          nome: string
          preco?: number
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          minutos_adicionais?: number
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      home_slides: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          imagem_url: string
          legenda: string | null
          ordem: number
          titulo: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          imagem_url: string
          legenda?: string | null
          ordem?: number
          titulo?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          imagem_url?: string
          legenda?: string | null
          ordem?: number
          titulo?: string | null
        }
        Relationships: []
      }
      lista_espera: {
        Row: {
          cidade: string | null
          criado_em: string
          email: string
          id: string
        }
        Insert: {
          cidade?: string | null
          criado_em?: string
          email: string
          id?: string
        }
        Update: {
          cidade?: string | null
          criado_em?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          autor_id: string
          booking_id: string
          conteudo: string
          criado_em: string
          id: string
          lida_em: string | null
        }
        Insert: {
          autor_id: string
          booking_id: string
          conteudo: string
          criado_em?: string
          id?: string
          lida_em?: string | null
        }
        Update: {
          autor_id?: string
          booking_id?: string
          conteudo?: string
          criado_em?: string
          id?: string
          lida_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_profissional: {
        Row: {
          autor_id: string | null
          criado_em: string
          id: string
          lida_em: string | null
          mensagem: string
          profissional_user_id: string
        }
        Insert: {
          autor_id?: string | null
          criado_em?: string
          id?: string
          lida_em?: string | null
          mensagem: string
          profissional_user_id: string
        }
        Update: {
          autor_id?: string | null
          criado_em?: string
          id?: string
          lida_em?: string | null
          mensagem?: string
          profissional_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_profissional_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_profissional_profissional_user_id_fkey"
            columns: ["profissional_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          chave: string
          descricao: string | null
          valor: number
        }
        Insert: {
          chave: string
          descricao?: string | null
          valor: number
        }
        Update: {
          chave?: string
          descricao?: string | null
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf: string | null
          criado_em: string
          data_nascimento: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          anos_experiencia: number | null
          bio: string | null
          cidade: string | null
          cidades_atendidas: string[]
          comprovante_url: string | null
          criado_em: string
          disponivel: boolean
          doc_cpf_url: string | null
          doc_identidade_url: string | null
          doc_tipo: string | null
          documento_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nota_media: number
          pix_chave: string | null
          pix_tipo: string | null
          pix_titular: string | null
          raio_km: number | null
          regiao: string | null
          status: string
          telefone_recado: string | null
          tipos_limpeza: string[]
          total_avaliacoes: number
          total_servicos: number
          user_id: string
          verificada: boolean
        }
        Insert: {
          anos_experiencia?: number | null
          bio?: string | null
          cidade?: string | null
          cidades_atendidas?: string[]
          comprovante_url?: string | null
          criado_em?: string
          disponivel?: boolean
          doc_cpf_url?: string | null
          doc_identidade_url?: string | null
          doc_tipo?: string | null
          documento_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nota_media?: number
          pix_chave?: string | null
          pix_tipo?: string | null
          pix_titular?: string | null
          raio_km?: number | null
          regiao?: string | null
          status?: string
          telefone_recado?: string | null
          tipos_limpeza?: string[]
          total_avaliacoes?: number
          total_servicos?: number
          user_id: string
          verificada?: boolean
        }
        Update: {
          anos_experiencia?: number | null
          bio?: string | null
          cidade?: string | null
          cidades_atendidas?: string[]
          comprovante_url?: string | null
          criado_em?: string
          disponivel?: boolean
          doc_cpf_url?: string | null
          doc_identidade_url?: string | null
          doc_tipo?: string | null
          documento_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nota_media?: number
          pix_chave?: string | null
          pix_tipo?: string | null
          pix_titular?: string | null
          raio_km?: number | null
          regiao?: string | null
          status?: string
          telefone_recado?: string | null
          tipos_limpeza?: string[]
          total_avaliacoes?: number
          total_servicos?: number
          user_id?: string
          verificada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_bloqueios: {
        Row: {
          criado_em: string
          data: string
          id: string
          motivo: string | null
          profissional_id: string
        }
        Insert: {
          criado_em?: string
          data: string
          id?: string
          motivo?: string | null
          profissional_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          motivo?: string | null
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_bloqueios_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          atualizado_em: string
          chave: string
          valor: Json
        }
        Insert: {
          atualizado_em?: string
          chave: string
          valor?: Json
        }
        Update: {
          atualizado_em?: string
          chave?: string
          valor?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      participa_booking: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      profissionais_disponiveis: {
        Args: { _data: string; _regiao: string; _tipo_limpeza?: string }
        Returns: {
          anos_experiencia: number
          bio: string
          cidade: string
          foto_url: string
          id: string
          latitude: number
          longitude: number
          nome: string
          nota_media: number
          raio_km: number
          regiao: string
          tipos_limpeza: string[]
          total_avaliacoes: number
          total_servicos: number
          user_id: string
          verificada: boolean
        }[]
      }
      recusar_booking: { Args: { _booking_id: string }; Returns: string }
      sortear_profissional: {
        Args: { _data: string; _regiao: string; _tipo_limpeza?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "cliente" | "profissional" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["cliente", "profissional", "admin"],
    },
  },
} as const
